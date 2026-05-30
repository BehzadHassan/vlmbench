# VLMBench: Vision Language Model Benchmark for Change Detection

VLMBench is a highly interactive, comprehensive benchmarking and evaluation platform designed to assess the capabilities of Vision Language Models (VLMs) in remote sensing and change detection tasks. Built with Next.js, Prisma, and Tailwind CSS, this platform provides a structured, dynamic environment for qualitative and quantitative analysis of model-generated reports on satellite imagery.

## Overview

The primary objective of VLMBench is to evaluate how effectively modern VLMs can identify, classify, and report spatial and environmental changes between temporal image pairs. The application streamlines the process of reviewing model outputs, providing human evaluators with powerful visual tools and configurable scoring rubrics.

## Dataset & Masks

This benchmark utilizes the **LEVIR-CD** (Learning Vision and Remote sensing - Change Detection) dataset. LEVIR-CD consists of high-resolution Google Earth images, capturing significant land-use changes over time, including:
- Construction of new building footprints
- Urban expansion and infrastructure development
- Vegetation clearance and land modification

The platform automatically serves updated ground truth masks (labels) via an intelligent `updated_label` detection system, ensuring evaluators always see the most accurate change maps available. 

## Models Evaluated

The current evaluation pipeline includes benchmarking the **Qwen2-VL-2B** model. The architecture is designed to be extensible, allowing for the integration and comparison of multiple state-of-the-art vision-language models in future iterations.

## Evaluation Pipeline & Prompts

The evaluation methodology is structured around a rigorous prompt engineering pipeline, testing the model against four distinct prompting strategies (P1 through P4):

1. **Prompt Strategy 1 (P1 - Narrative Report):** Requires a concise, objective report covering change status, type, location, scale, and unchanged elements.
2. **Prompt Strategy 2 (P2 - Step-by-Step Analysis):** Forces the model into a structured reasoning process: describing Image 1, describing Image 2, identifying differences, and culminating in a final standardized report.
3. **Prompt Strategy 3 (P3 - Intelligence-Grade Report):** Demands a highly structured, strict classification report citing specific visual evidence to support change status conclusions.
4. **Prompt Strategy 4 (P4 - Zero-Shot / Open-Ended):** Provides minimal instruction, serving as a baseline to measure the model's unguided change detection capabilities.

## Key Application Features

### 🛠 Dynamic Evaluation Metrics (Admin Dashboard)
- **Customizable Rubrics:** 10 core metrics (M1-M10) dynamically mapped to the 4 prompt strategies.
- **Admin Control:** An Admin Dashboard allows reviewers to create, edit, copy, and reorder metrics on the fly.
- **Dynamic Ranges:** Set custom Minimum, Maximum, and Default boundaries for any metric (e.g., 0-5, 1-10).
- **Scoring Explainers:** Interactive "Info" boxes on the evaluation form display exact rules for each score tier (e.g., 5=Highly Accurate, 0=Hallucination) to eliminate subjective grading.

### 🔍 Advanced Image Visualizer
- **Side-by-Side & Swipe Modes:** Evaluators can inspect images next to each other, or use an interactive horizontal/vertical slider to wipe between the 'Before' and 'After' shots.
- **Deep Zoom & Magnifier:** Hover over imagery to reveal a crosshair magnifying glass, or click to launch a full-screen Deep Zoom modal.
- **3rd View Mode (Analysis Layer):** Toggle the third panel between:
  - **Raw Mask:** The original black/white ground truth label.
  - **Difference Map:** A computed visual difference blend between Image 1 and Image 2.
  - **Overlay Mode:** The 'After' image overlaid with the mask. Includes adjustable color tints (Red, Green, Blue, etc.) and opacity sliders.
- **Spatial Direction Hints:** Translucent N, S, E, W markers natively overlaid on the visuals, helping evaluators quickly verify if the model correctly identified changes in the "North-West" or "South".

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma
- **Styling:** Tailwind CSS v4 (Glassmorphism & Dark Mode Aesthetics)
- **Data Processing:** PapaParse for CSV ingestion

## Access and Deployment

This application is deployed and hosted on **Vercel**. 
You can access the live deployment via the Vercel link provided on the repository's GitHub page.

## Architecture & Schema

The application relies on a streamlined database schema:
- **Evaluation:** Stores the primary review data, including JSON-structured scores, notes, timestamps, and the specific identifier linking the image pair, model, and prompt used.
- **Setting:** Maintains application-wide configuration, such as the dynamically mapped metrics, their min/max values, descriptions, and interactive scoring explainer rules.
- **AuditLog:** Tracks system-level actions such as configuration updates and data resets.
