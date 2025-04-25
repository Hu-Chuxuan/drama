# 🤖 OpenAI Research Agent

This project is adapted from [OpenAI's openai-agents-python repository](https://github.com/openai/openai-agents-python/), specifically the `/examples/research_bot/`, to support the **DramaBench** evaluation framework.

## 🚀 Running the Agent

Follow the steps below to reproduce our results.

### 1. Install [uv](https://docs.astral.sh/uv/)

Ensure you have `uv` installed:

```bash
uv --version
```

### 2. Set OpenAI API Key

Get an [OpenAI API key](https://platform.openai.com/api-keys) and set it as an environment variable:

```bash
export OPENAI_API_KEY=your-openai-api-key
```

### 3. Install Dependencies

Run the following command to install dependencies:

```bash
make sync
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

All execution outputs will be automatically saved in the `results/` directory for further analysis and evaluation.


