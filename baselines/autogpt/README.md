# 🤖 AutoGPT

This project is adapted from [the open-sourced AutoGPT project](https://github.com/Significant-Gravitas/AutoGPT) to support the **DramaBench** evaluation framework.

## 🚀 Running the Agent

Follow the steps below to reproduce our results on DramaBench.

### 1. Install [Poetry](https://python-poetry.org/) and Sync Dependencies
   ```bash
   cd AutoGPT/classic/original_autogpt
   poetry sync
   ```

### 2. Domain Restrictions
Configure the search agent by blacklisting external sites. Create a [Google Programmable Search Engine](https://programmablesearchengine.google.com/about/) and add the following under "Sites to exclude":

   ```
   *.usafacts.org/*
   *.guardian.com/*
   *.facebook.com/*
   *.instagram.com/*
   *.reuters.com/*
   *.factcheck.org/*
   *.politifact.com/*
   *.twitter.com/*
   *.x.com/*
   ```

### 3. Set Environment Variables
Enable the [Custom Search API](https://developers.google.com/custom-search/v1/overview) and retrieve both the **Search Engine ID** and **API Key**.

Add the following to your `.env` file inside `original_autogpt`:

   ```
   GOOGLE_API_KEY=your-google-api-key
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your-search-engine-id
   OPENAI_API_KEY=your-openai-api-key
   SMART_LLM=gpt-4o-2024-11-20
   FAST_LLM=gpt-4o-2024-11-20
   ```

### 4. Run DramaBench Tasks

Use the provided script to run experiments for different DramaBench tasks:

```bash
./run_drama.sh [qa|verification]
```

Replace `[qa|verification]` with the desired task type. For example:

- Run **QA tasks**:
  ```bash
  ./run_drama.sh qa
  ```

- Run **Verification tasks**:
  ```bash
  ./run_drama.sh verification
  ```

## 📁 Result Collection

All execution outputs will be automatically saved in the `autogpt/AutoGPT/classic/original_autogpt/drama/results` directory for further analysis and evaluation.

