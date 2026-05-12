# Gemini Developer Workbench - Day 9

A high-performance, cost-aware development environment for experimenting with the Google Gemini API.

## ?? File Breakdown

### ??? Core Utilities
- **logger.js**: The central logging engine. It captures tokens and latency to usage_logs.csv.
- **usage_logs.csv**: The local database of all API spend.

### ?? Experiments & Caching
- **test_caching.js**: A live Proof of Concept for Context Caching.
- **gemini_cache.js**: A simulation script for cost optimization.

### ?? Interactive Tools
- **chat.js**: Terminal chatbot with memory and logging.
- **explain_code.js**: Reads the whole project and explains it.
- **list_models.js**: Lists available models and features.
