# 大学生竞赛讲解

竖屏短片，一条讲清楚一个大学生竞赛。画面用 HTML Canvas 的 `render(t)` 画出来，Playwright 逐帧截图，FFmpeg 合成。配乐是按这条片子的切点写的原声，不是现成曲库。

## 01 计算机设计大赛

主题用的是「全国大学生计算机设计大赛」。屏幕上的正式名称是中国大学生计算机设计大赛（4C）。事实来自大赛官网公开的参赛要求：<https://jsjds.blcu.edu.cn/gyds1/csyq.htm>。

画面是 1080×1920、30 帧、42 秒。

| 时间 | 画面 |
| --- | --- |
| 0.0–4.8 | 标题，并写出正式名称 |
| 4.8–10.4 | 交的是作品，不是试卷 |
| 10.4–16.6 | 2–9 名同校本科生 |
| 16.6–23.6 | 校赛、省赛、国赛 |
| 23.6–31.8 | 11 个大类 |
| 31.8–37.8 | 从做完一件小作品开始 |
| 37.8–42.0 | 第 01 条收束 |

## 生成

```bash
npm install
npx playwright install chromium
npm run build
```

成品在 `episodes/01/dist/01-silent.mp4` 和 `episodes/01/dist/01.mp4`。预览时间轴：

```bash
npm run preview
```

打开 <http://127.0.0.1:4173/episodes/01/>。
