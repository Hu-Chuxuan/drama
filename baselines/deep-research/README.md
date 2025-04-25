# 🤖 Deep Research

This project is adapted from [Open Deep Research](https://github.com/btahir/open-deep-research) to support the **DramaBench** evaluation framework.

## 🚀 Running the Agent

Follow the steps below to set up the environment and reproduce our results on **DramaBench**.

### 1. Install [uv](https://docs.astral.sh/uv/)

Ensure you have `uv` installed:

```bash
uv --version
```

### 2. Configure API Keys

Ensure your environment contains the necessary credentials. You can do this by either:

- Creating or updating a `.env.local` file in the project root
- Or exporting the variables directly into your shell environment

The following keys are required:

```env
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_CX=your_custom_search_engine_id
OPENAI_API_KEY=your_openai_api_key
```

### 3. Start the Service

The Open Deep Research service must be running locally in order to process requests.

1. Install all required dependencies:
   ```bash
   npm install
   ```

2. Launch the local development server:
   ```bash
   npm run dev
   ```

This will start the service on your local machine, ready to handle incoming tasks.

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
- Structured results are written to the `results/` directory.
- Raw data containing original report and agent traces is placed in `outputs/`.