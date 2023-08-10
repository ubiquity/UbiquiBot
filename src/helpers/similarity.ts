import { getBotContext } from "../bindings";
import { Payload, Choices } from "../types";
import { listAllIssuesForRepo, upsertCommentToIssue } from "../helpers/issue";
import axios from "axios";

export const findDuplicateOne = async () => {
  const { payload: _payload } = getBotContext();
  const issue = (_payload as Payload).issue;
  const issues = await listAllIssuesForRepo("all");
  issues.shift();
  const importantWords = await extractImportantWords();
  const wordCount = importantWords.length;
  for (const iss of issues) {
    if (iss.body) {
      const probability = (countIncludedWords(iss.body, importantWords) * 100.0 ) / wordCount;
      if (probability > parseInt(process.env.SIMILARITY_THRESHOLD || "80")) {
        if (issue?.number) {
          await upsertCommentToIssue(issue?.number, `Similar issue (${iss.title}) found at ${iss.html_url}.\nSimilarity is about ${probability}%`, "created");
          return;
        }
      }
    }
  }
}

const countIncludedWords = (inputString: string, words: string[]): number => {
  const lowerCaseString = inputString.toLowerCase(); // Convert the string to lowercase for case-insensitive matching
  
  let count = 0;
  for (const word of words) {
    if (lowerCaseString.includes(word.toLowerCase())) {
      count++;
    }
  }
  
  return count;
}

export const extractImportantWords = async (): Promise<string[]> => {
  const { payload: _payload } = getBotContext();
  const issue = (_payload as Payload).issue;
  const {result: res} = await getAnswerFromChatGPT(`Issue title: "${issue?.title}"\nIssue body: "${issue?.body}"`);
  return res.split('#');
};

export const getAnswerFromChatGPT = async ( prompt: string ): Promise<{ result: string }> => {
  const body = JSON.stringify({"model":"gpt-3.5-turbo","messages":[{"role":"system","content":process.env.CHATGPT_SYSTEM_PROMPT_FOR_IMPORTANT_WORDS || "I need your help to find duplicate issues on my GitHub repository. For context, the entire strategy is the following:\n\n1. A new issue is posted\n2. We ask you to extract a word list of the most \"important\" (i.e. unique adjectives?) words.\n3. We search the repository for all issues with the important words.\n4. We go from highest issue number (most recent) and read the issue description.\n5. If >80% confidence that it's a redundant issue, stop the search and link back to it with a warning saying that it's likely to be a duplicate.\nRight now, we are on step 2.\nPlease separate the words by # so I can parse them easily. Please answer simply as I only need the important words."},{"role":"user","content":process.env.CHATGPT_USER_PROMPT_FOR_IMPORTANT_WORDS || "I need your help to find duplicate issues on my GitHub repository. For context, the entire strategy is the following:\n\n1. A new issue is posted\n2. We ask you to extract a word list of the most \"important\" (i.e. unique adjectives?) words.\n3. We search the repository for all issues with the important words.\n4. We go from highest issue number (most recent) and read the issue description.\n5. If >80% confidence that it's a redundant issue, stop the search and link back to it with a warning saying that it's likely to be a duplicate.\nRight now, we are on step 2.\nPlease separate the words by # so I can parse them easily. Please answer simply as I only need the important words." + prompt}],"max_tokens":1500,"temperature":0,"stream":false});
  const config = {
    method: 'post',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: { 
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 
      'Content-Type': 'application/json'
    },
    data : body
  };
  try {
      const response = await axios(config);
      const data: Choices = response.data;
      const { choices: choice } = data;
      const answer = choice[0].message.content;
      return { result: answer };
    }
    catch (error) {
      return { result: '' };
  }
}
