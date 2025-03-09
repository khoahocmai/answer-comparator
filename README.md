# doc-quiz-randomizer-check

A Node.js utility for parses and evaluates answer sheets from .docx or .txt files. It extracts questions, chosen answers, and compares them with the correct answer key.

## Features

- Reads .docx and .txt files containing questions and answers.
- Extracts questions, chosen answers, and the correct answer key.
- Supports multiple-choice questions with single or multiple correct answers.
- Compares student answers with the correct answers and provides a summary.

## Prerequisites

- **Node.js** (version 14 or higher)
- A source .docx file (randoms.docx) that contains your quiz questions following the [repository](https://github.com/khoahocmai/doc-quiz-randomizer).

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/khoahocmai/doc-quiz-randomizer-check.git
   cd doc-quiz-randomizer-check
   ```

1. Install dependencies:
   ```bash
   npm install
   ```

## Usage

1. Place your `questions.docx` file inside a folder.

2. Run the script by providing a directory containing the answer sheet files:

```bash
npm run dev directory="path/to/your/folder"
```

## Output

```vbnet
[U] Unanswered question:
1. What is the capital of France?
A. Berlin
B. Madrid
C. Paris
D. Rome

[X] Incorrect question:
2. What is the largest planet in our solar system?
- Your answers:
  + B. Earth
- Correct answers:
  + A. Jupiter

Summary:
+--------------------+--------+
| (index)            | Count  |
+--------------------+--------+
| Total questions    | 5      |
| Answered questions | 4      |
| Correct            | 3      |
| Incorrect          | 1      |
| Correct percentage │ '75.0%'|
| Unanswered         | 1      |
+-------------------+---------+
```

## Dependencies

- **mammoth**: Extracts raw text from .docx files.
- **chalk**: Library for terminal string styling.
- **fs** and **path**: Node.js modules for file system and path handling.

👨‍💻 [Created by khoahocmai](https://github.com/khoahocmai)
