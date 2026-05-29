# VLMBench: Vision Language Model Benchmark for Change Detection

VLMBench is a comprehensive benchmarking and evaluation platform designed to assess the capabilities of Vision Language Models (VLMs) in remote sensing and change detection tasks. Built with Next.js, Prisma, and Tailwind CSS, this platform provides a structured environment for qualitative and quantitative analysis of model-generated reports on satellite imagery.

## Overview

The primary objective of VLMBench is to evaluate how effectively modern VLMs can identify, classify, and report spatial and environmental changes between temporal image pairs. The application streamlines the process of reviewing model outputs, enabling human evaluators to score responses based on accuracy, detail, and adherence to specific reporting formats.

## Dataset

This benchmark utilizes the **LEVIR-CD** (Learning Vision and Remote sensing - Change Detection) dataset. LEVIR-CD consists of high-resolution Google Earth images, capturing significant land-use changes over time, including:
- Construction of new building footprints
- Urban expansion and infrastructure development
- Vegetation clearance and land modification

The benchmark specifically leverages validation image pairs (BEFORE and AFTER) to test the model's ability to discern subtle and substantial changes in complex peri-urban environments.

## Models Evaluated

The current evaluation pipeline includes benchmarking the **Qwen2-VL-2B** model. The architecture is designed to be extensible, allowing for the integration and comparison of multiple state-of-the-art vision-language models in future iterations.

## Evaluation Pipeline

The evaluation methodology is structured around a rigorous prompt engineering pipeline, testing the model against four distinct prompting strategies (P1 through P4):

1. **Prompt Strategy 1 (P1 - Narrative Report):** Requires a concise, objective report covering change status, type, location, scale, and unchanged elements.
2. **Prompt Strategy 2 (P2 - Step-by-Step Analysis):** Forces the model into a structured reasoning process: describing Image 1, describing Image 2, identifying differences, and culminating in a final standardized report.
3. **Prompt Strategy 3 (P3 - Intelligence-Grade Report):** Demands a highly structured, strict classification report citing specific visual evidence to support change status conclusions.
4. **Prompt Strategy 4 (P4 - Zero-Shot / Open-Ended):** Provides minimal instruction, serving as a baseline to measure the model's unguided change detection capabilities.

### Application Architecture

1. **Data Ingestion:** Model responses are pre-generated and stored in batch CSV format, alongside metadata linking them to the respective LEVIR-CD image pairs.
2. **Review Interface:** The Next.js application serves the imagery and model responses side-by-side. Evaluators can seamlessly navigate through the dataset.
3. **Scoring & Persistence:** Evaluators assign scores based on configurable metrics. These scores, along with evaluator notes and flags, are persisted to a PostgreSQL database using Prisma ORM.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Styling:** Tailwind CSS v4
- **Data Processing:** PapaParse for CSV ingestion

## Access and Deployment

This application is deployed and hosted on **Vercel**. 

You can access the live deployment via the Vercel link provided on the repository's GitHub page.

## Architecture & Schema

The application relies on a streamlined database schema:
- **Evaluation:** Stores the primary review data, including JSON-structured scores, notes, timestamps, and the specific identifier linking the image pair, model, and prompt used.
- **Setting:** Maintains application-wide configuration, such as the defined metrics for evaluation.
- **AuditLog:** Tracks system-level actions such as configuration updates and data clears.
