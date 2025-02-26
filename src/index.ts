import fs from "fs";
import path from "path";
import chalk from "chalk";
import mammoth from "mammoth";

interface Question {
  number: number;
  text: string; // Nội dung câu hỏi (không bao gồm phương án)
  chosenAnswer: string | null; // Phương án được chọn (được đánh dấu với [*]=)
  fullText: string; // Nội dung đầy đủ của câu hỏi (câu hỏi + các phương án)
}

interface AnswerKey {
  [questionNumber: number]: string;
}

// Hàm đọc file (.docx hoặc .txt)
async function readFileContent(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    return fs.readFileSync(filePath, "utf8");
  }
}

// Hàm phân tích file: tách phần câu hỏi và phần answer key
async function parseFile(
  filePath: string
): Promise<{ questions: Question[]; answerKey: AnswerKey }> {
  const content = await readFileContent(filePath);

  // Tìm phần answer key bắt đầu từ "answers:["
  const keyMarker = "answers:[";
  const indexKey = content.indexOf(keyMarker);
  if (indexKey === -1) {
    throw new Error("Không tìm thấy phần answer key trong file.");
  }
  const studentPart = content.substring(0, indexKey);
  const answerKeyPart = content.substring(indexKey);

  // Phân tích answer key theo mẫu: {Q: 1; A: B}
  const answerKey: AnswerKey = {};
  const keyRegex = /{Q:\s*(\d+);\s*A:\s*([A-Z])}/g;
  let match;
  while ((match = keyRegex.exec(answerKeyPart)) !== null) {
    const num = parseInt(match[1], 10);
    const ans = match[2].trim();
    answerKey[num] = ans;
  }

  // Phân tích câu hỏi và đáp án của thí sinh
  const questions: Question[] = [];
  const lines = studentPart.split(/\r?\n/);
  let currentQuestion: Question | null = null;

  // Regex nhận diện câu hỏi: bắt đầu bằng số và dấu chấm
  const questionRegex = /^(\d+)\.\s*(.+)$/;
  // Regex nhận diện phương án: dạng "A. Nội dung;[*]" hoặc "B. Nội dung;[*]="
  const optionRegex = /^([A-Z])\.\s*(.+?)\s*;\[\*\](=?)$/;

  for (let line of lines) {
    line = line.trim();
    if (line === "") continue;
    const questionMatch = line.match(questionRegex);
    if (questionMatch) {
      // Nếu có câu hỏi mới, lưu câu hỏi hiện tại nếu có
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      const num = parseInt(questionMatch[1], 10);
      const text = questionMatch[2].trim();
      currentQuestion = {
        number: num,
        text: text,
        chosenAnswer: null,
        fullText: line,
      };
    } else if (currentQuestion) {
      // Nếu không phải dòng câu hỏi thì kiểm tra xem có phải dòng đáp án không
      const optionMatch = line.match(optionRegex);
      if (optionMatch) {
        // Cập nhật fullText để hiển thị đầy đủ câu hỏi
        currentQuestion.fullText += "\n" + line;
        // Nếu có dấu "=" thì đánh dấu đây là đáp án được chọn
        if (optionMatch[3] === "=") {
          currentQuestion.chosenAnswer = `${
            optionMatch[1]
          }. ${optionMatch[2].trim()}`;
        }
      } else {
        // Nếu dòng không khớp với option, thêm vào fullText
        currentQuestion.fullText += "\n" + line;
      }
    }
  }
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return { questions, answerKey };
}

// Hàm so sánh đáp án của thí sinh với answer key và hiển thị kết quả
function compareAnswers(
  questions: Question[],
  answerKey: AnswerKey,
  suppressUnansweredLog: boolean = false
): void {
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  questions.forEach((q) => {
    const correctAns = answerKey[q.number];
    if (!correctAns) {
      unanswered++;
      console.log(
        chalk.yellow(
          `\n[!] No corresponding answer found for question ${q.number}:\n${q.fullText}\n`
        )
      );
    } else if (!q.chosenAnswer) {
      unanswered++;
      if (!suppressUnansweredLog) {
        console.log(chalk.cyan(`\n[U] Unanswered question:\n${q.fullText}\n`));
      }
    } else if (
      q.chosenAnswer.charAt(0).toUpperCase() === correctAns.toUpperCase()
    ) {
      correct++;
    } else {
      incorrect++;
      console.log(chalk.red(`\n[X] Incorrect question:`));
      console.log(chalk.red(`${q.number}. ${q.text}`));
      console.log(chalk.red(`- Your answers: \n` + `  + ${q.chosenAnswer}`));
      console.log(chalk.green(`- Correct answers: \n` + `  + ${correctAns}`));
    }
  });

  const totalQuestions = questions.length;
  const answered = correct + incorrect;
  const correctPercentage = answered ? (correct / answered) * 100 : 0;

  console.log("\nSummary:");
  console.table({
    "Total questions": { Count: totalQuestions },
    "Answered questions": { Count: answered },
    Correct: { Count: correct },
    Incorrect: { Count: incorrect },
    "Correct percentage": { Count: `${correctPercentage.toFixed(1)}%` },
    Unanswered: { Count: unanswered },
  });
}

// Hàm chính: duyệt folder và xử lý file randoms.docx hoặc randoms.txt
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node index.js directory="path/to/folder"');
    process.exit(0);
  }

  const dirArg = args.find((arg) => arg.startsWith("directory="));
  if (!dirArg) {
    console.error('Vui lòng cung cấp folder với định dạng: directory="..."');
    process.exit(1);
  }
  const folderPath = dirArg.split("=")[1];
  const resolvedFolder = path.resolve(folderPath);

  if (
    !fs.existsSync(resolvedFolder) ||
    !fs.statSync(resolvedFolder).isDirectory()
  ) {
    console.error("Đường dẫn không hợp lệ hoặc không phải folder.");
    process.exit(1);
  }

  // Tìm file có tên chứa "randoms" với đuôi .docx hoặc .txt
  const candidateFiles = fs.readdirSync(resolvedFolder).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return (
      file.toLowerCase().includes("randoms") &&
      (ext === ".docx" || ext === ".txt")
    );
  });

  if (candidateFiles.length === 0) {
    console.error(
      "Không tìm thấy file randoms.docx hay randoms.txt trong folder."
    );
    process.exit(1);
  }

  const filePath = path.join(resolvedFolder, candidateFiles[0]);
  try {
    const { questions, answerKey } = await parseFile(filePath);
    compareAnswers(questions, answerKey);
  } catch (err: any) {
    console.error("Lỗi khi xử lý file:", err.message);
  }
}

main().catch((err) => {
  console.error(err);
});
