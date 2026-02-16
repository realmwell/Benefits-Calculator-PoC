#!/usr/bin/env python3
"""
DC Benefits Finder — Corpus Builder

Downloads and processes DC benefits source documents into chunked JSONL
for embedding. Run this script to build/refresh the corpus.

Usage:
    python build_corpus.py

Output:
    backend/corpus/processed/all_chunks.jsonl
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup

# ── Source Documents ──────────────────────────────────────────────────

SOURCES = [
    {
        "url": "https://dhs.dc.gov/page/public-benefits",
        "program_name": "DC Public Benefits Overview",
        "description": "DHS public benefits overview",
    },
    {
        "url": "https://dhs.dc.gov/service/snap",
        "program_name": "SNAP",
        "description": "SNAP eligibility details",
    },
    {
        "url": "https://dhs.dc.gov/service/temporary-cash-assistance-needy-families-tanf",
        "program_name": "TANF",
        "description": "TANF program page",
    },
    {
        "url": "https://dhcf.dc.gov",
        "program_name": "Medicaid",
        "description": "DC Medicaid/CHIP",
    },
    {
        "url": "https://dhcf.dc.gov/service/dc-healthcare-alliance",
        "program_name": "DC Healthcare Alliance",
        "description": "DC Healthcare Alliance rules",
    },
    {
        "url": "https://dchealthlink.com",
        "program_name": "DC Health Link",
        "description": "Marketplace info",
    },
    {
        "url": "https://dcpaidfamilyleave.dc.gov",
        "program_name": "DC Paid Family Leave",
        "description": "Paid family leave benefits",
    },
    {
        "url": "https://does.dc.gov/service/unemployment-compensation",
        "program_name": "Unemployment Insurance",
        "description": "DC unemployment compensation",
    },
    {
        "url": "https://doee.dc.gov/liheap",
        "program_name": "LIHEAP",
        "description": "LIHEAP energy assistance",
    },
    {
        "url": "https://liheapch.acf.gov/profiles/DC.htm",
        "program_name": "LIHEAP",
        "description": "LIHEAP DC profile",
    },
    {
        "url": "https://dchealth.dc.gov/service/wic",
        "program_name": "WIC",
        "description": "DC WIC program",
    },
    {
        "url": "https://osse.dc.gov/childcaresubsidyfaq",
        "program_name": "Child Care Subsidy",
        "description": "DC child care subsidy FAQ",
    },
    {
        "url": "https://otr.cfo.dc.gov/page/dc-eitc",
        "program_name": "DC EITC",
        "description": "DC Earned Income Tax Credit",
    },
    {
        "url": "https://disb.dc.gov/eitc",
        "program_name": "DC EITC",
        "description": "DC EITC campaign page",
    },
    {
        "url": "https://otr.cfo.dc.gov/page/real-property-tax-reliefs-credits-and-deductions",
        "program_name": "Property Tax Relief",
        "description": "DC property tax relief",
    },
    {
        "url": "https://www.ssa.gov/ssi",
        "program_name": "SSI",
        "description": "SSI overview",
    },
    {
        "url": "https://www.ssa.gov/oact/cola/SSIamts.html",
        "program_name": "SSI",
        "description": "SSI benefit amounts",
    },
    {
        "url": "https://osse.dc.gov/service/national-school-lunch-program",
        "program_name": "School Meals",
        "description": "National School Lunch Program (DC)",
    },
    {
        "url": "https://kidsridefree.dc.gov",
        "program_name": "Kids Ride Free",
        "description": "Kids Ride Free program",
    },
    {
        "url": "https://aspe.hhs.gov/poverty-guidelines",
        "program_name": "Federal Poverty Guidelines",
        "description": "HHS Poverty Guidelines",
    },
    {
        "url": "https://www.fns.usda.gov/snap/allotment",
        "program_name": "SNAP",
        "description": "SNAP allotments by household size",
    },
    {
        "url": "https://www.fns.usda.gov/snap/eligibility",
        "program_name": "SNAP",
        "description": "SNAP deductions and eligibility",
    },
    {
        "url": "https://dhs.dc.gov/page/public-benefits-faq",
        "program_name": "DC Public Benefits FAQ",
        "description": "Cross-program FAQ",
    },
    {
        "url": "https://www.snapscreener.com/guides/district-of-columbia",
        "program_name": "SNAP",
        "description": "DC SNAP screener guide",
    },
    {
        "url": "https://www.benefits.gov/benefit/1624",
        "program_name": "Medicaid",
        "description": "Benefits.gov DC Medicaid",
    },
    {
        "url": "https://dhs.dc.gov/service/interim-disability-assistance",
        "program_name": "IDA",
        "description": "Interim Disability Assistance",
    },
]

# ── Configuration ─────────────────────────────────────────────────────

CHUNK_SIZE = 400  # Target tokens per chunk (approximate: 1 token ≈ 4 chars)
CHUNK_OVERLAP = 50
CHARS_PER_TOKEN = 4
RAW_DIR = Path(__file__).parent.parent / "corpus" / "raw"
PROCESSED_DIR = Path(__file__).parent.parent / "corpus" / "processed"
USER_AGENT = "DCBenefitsFinder/1.0 (civic-tech research project)"


def download_page(url: str) -> str | None:
    """Download a URL and return raw HTML content."""
    try:
        headers = {"User-Agent": USER_AGENT}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  ERROR downloading {url}: {e}")
        return None


def extract_text(html: str) -> str:
    """Extract clean text from HTML, removing nav/footer/boilerplate."""
    soup = BeautifulSoup(html, "html.parser")

    # Remove unwanted elements
    for tag in soup.find_all(
        ["nav", "footer", "header", "script", "style", "noscript", "aside"]
    ):
        tag.decompose()

    # Remove common boilerplate classes/IDs
    for selector in [
        ".breadcrumb",
        ".sidebar",
        "#sidebar",
        ".menu",
        "#menu",
        ".cookie-notice",
        ".social-share",
    ]:
        for el in soup.select(selector):
            el.decompose()

    # Get text
    text = soup.get_text(separator="\n", strip=True)

    # Clean up whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)

    return text.strip()


def chunk_text(
    text: str, source_url: str, program_name: str, description: str
) -> list[dict]:
    """Split text into overlapping chunks with metadata."""
    chunks = []
    char_chunk_size = CHUNK_SIZE * CHARS_PER_TOKEN
    char_overlap = CHUNK_OVERLAP * CHARS_PER_TOKEN

    # Split into paragraphs first, then recombine into chunks
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]

    current_chunk = ""
    chunk_id = 0

    for para in paragraphs:
        if len(current_chunk) + len(para) > char_chunk_size and current_chunk:
            # Save current chunk
            chunks.append(
                {
                    "text": current_chunk.strip(),
                    "source_url": source_url,
                    "program_name": program_name,
                    "description": description,
                    "chunk_id": f"{urlparse(source_url).netloc}_{chunk_id}",
                    "last_fetched": time.strftime("%Y-%m-%d"),
                }
            )
            chunk_id += 1

            # Start new chunk with overlap from end of previous
            overlap_text = current_chunk[-char_overlap:] if len(current_chunk) > char_overlap else ""
            current_chunk = overlap_text + "\n\n" + para
        else:
            current_chunk = current_chunk + "\n\n" + para if current_chunk else para

    # Don't forget the last chunk
    if current_chunk.strip():
        chunks.append(
            {
                "text": current_chunk.strip(),
                "source_url": source_url,
                "program_name": program_name,
                "description": description,
                "chunk_id": f"{urlparse(source_url).netloc}_{chunk_id}",
                "last_fetched": time.strftime("%Y-%m-%d"),
            }
        )

    return chunks


def main():
    """Main pipeline: download -> extract -> chunk -> save."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    all_chunks = []
    total_sources = len(SOURCES)

    for i, source in enumerate(SOURCES):
        url = source["url"]
        program = source["program_name"]
        desc = source["description"]

        print(f"[{i + 1}/{total_sources}] {program}: {url}")

        # Download
        html = download_page(url)
        if not html:
            continue

        # Save raw
        safe_name = re.sub(r"[^a-zA-Z0-9]", "_", url)[:100]
        raw_path = RAW_DIR / f"{safe_name}.html"
        raw_path.write_text(html, encoding="utf-8")

        # Extract text
        text = extract_text(html)
        if len(text) < 100:
            print(f"  WARNING: Very little text extracted ({len(text)} chars)")
            continue

        print(f"  Extracted {len(text)} chars")

        # Chunk
        chunks = chunk_text(text, url, program, desc)
        print(f"  Created {len(chunks)} chunks")
        all_chunks.extend(chunks)

        # Rate limiting
        time.sleep(1)

    # Save all chunks as JSONL
    output_path = PROCESSED_DIR / "all_chunks.jsonl"
    with open(output_path, "w") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk) + "\n")

    print(f"\nDone! {len(all_chunks)} chunks saved to {output_path}")


if __name__ == "__main__":
    main()
