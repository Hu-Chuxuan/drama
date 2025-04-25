# 🤖 WebVoyager

This project is adapted from [WebVoyager](https://github.com/MinorJerry/WebVoyager) to support the **DramaBench** evaluation framework.

## 🚀 Running the Agent

Follow the steps below to set up the environment and reproduce our results on **DramaBench**.

### 1. Install [uv](https://docs.astral.sh/uv/)

Ensure you have `uv` installed:

```bash
uv --version
```

### 2. Ensure Chrome is Installed

Make sure Google Chrome is available on your system.

On Linux (e.g., CentOS), install Chromium with:

  ```bash
  yum install chromium-browser
  ```

> Note: Newer versions of Selenium typically eliminate the need for manually installing ChromeDriver.

### 3. Set OpenAI API Key

Get an [OpenAI API key](https://platform.openai.com/api-keys) and include the following in your `.env` file:

```env
OPENAI_API_KEY=your_openai-api-key
```

or set it directly in your environment:

```bash
export OPENAI_API_KEY=your-openai-api-key
```

### 4. Run DramaBench Tasks

Use the provided script to execute DramaBench tasks:

```bash
./run_drama.sh [qa|verification]
```

Replace `[qa|verification]` with the desired task. For example:

- Run **QA tasks**:
  ```bash
  ./run_drama.sh qa
  ```

- Run **Verification tasks**:
  ```bash
  ./run_drama.sh verification
  ```

## 📁 Result Collection

- Execution logs are saved in `test_tasks.log`.
- Structured results are written to the `results/` directory.
- Intermediate artifacts, including screenshots and raw agent traces, are stored in the `results/raw/` directory.