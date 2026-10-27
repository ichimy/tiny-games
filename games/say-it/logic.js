export const WORDS = [
  { text: "熊猫", category: "动物" },
  { text: "长颈鹿", category: "动物" },
  { text: "小企鹅", category: "动物" },
  { text: "袋鼠", category: "动物" },
  { text: "章鱼", category: "动物" },
  { text: "恐龙", category: "动物" },
  { text: "蜗牛", category: "动物" },
  { text: "蜜蜂", category: "动物" },
  { text: "西瓜", category: "食物" },
  { text: "冰淇淋", category: "食物" },
  { text: "爆米花", category: "食物" },
  { text: "面条", category: "食物" },
  { text: "汉堡", category: "食物" },
  { text: "香蕉", category: "食物" },
  { text: "棒棒糖", category: "食物" },
  { text: "热气腾腾的汤", category: "食物" },
  { text: "刷牙", category: "动作" },
  { text: "打喷嚏", category: "动作" },
  { text: "跳绳", category: "动作" },
  { text: "游泳", category: "动作" },
  { text: "照相", category: "动作" },
  { text: "扫地", category: "动作" },
  { text: "吹泡泡", category: "动作" },
  { text: "系鞋带", category: "动作" },
  { text: "雨伞", category: "生活" },
  { text: "牙刷", category: "生活" },
  { text: "洗衣机", category: "生活" },
  { text: "红绿灯", category: "生活" },
  { text: "电风扇", category: "生活" },
  { text: "枕头", category: "生活" },
  { text: "眼镜", category: "生活" },
  { text: "消防车", category: "出行" },
  { text: "摩天轮", category: "出行" },
  { text: "热气球", category: "出行" },
  { text: "地铁", category: "出行" },
  { text: "滑板", category: "出行" },
];

export function shuffle(values, random = Math.random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export const buildWordQueue = (words, random = Math.random) => shuffle(words, random);

export const finishRound = (correct, skipped) => ({
  score: correct * 2 + skipped,
  correct,
  skipped,
});
