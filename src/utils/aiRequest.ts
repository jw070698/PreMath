//保存ai配置并封装相关方法
import OpenAI from "openai";
import config from "../config/config";

// 封装后的 ai 调用函数
//context 需要以固定格式作为参数，使用时可参见 https://platform.openai.com/docs/guides/text-generation/chat-completions-api
export async function chat(
    context: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string> {
    const openai = new OpenAI(config);

    // Check if context (messages) is empty or undefined
    if (!context || context.length === 0) {
        return "No messages provided.";
    }

    let res;
    try {
        res = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: context,
            n: 1,
        });
        console.log('res', res);
        return res.choices[0].message.content!;
    } catch (error) {
        console.error('Error:', error);
        return "An error occurred while processing your request.";
    }
}

export async function bigChat(
    context: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
): Promise<string> {
    const openai = new OpenAI(config);

    // Check if context (messages) is empty or undefined
    if (!context || context.length === 0) {
        return "No messages provided.";
    }

    let res;
    try {
        res = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: context,
            n: 1,
            max_tokens: 5,
        });
        console.log('res', res);
        return res.choices[0].message.content!;
    } catch (error) {
        console.error('Error:', error);
        return "An error occurred while processing your request.";
    }
}
