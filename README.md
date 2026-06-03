# GPT-Image-2 图像生成界面

一个本地运行的 APIMart GPT-Image-2 图像生成控制台。

## 启动

```powershell
npm start
```

打开：

```text
http://localhost:3000
```

## 功能

- 文生图与图生图
- Seedance 2.0 视频生成
- 支持 `auto`、`1:1`、`16:9`、`9:21` 等比例
- 支持 `1k`、`2k`、`4k` 分辨率档位，并拦截不支持的 4K 比例
- 支持最多 16 张参考图，可混合图片 URL 与本地上传图片
- 提交后按 `task_id` 轮询 `/v1/tasks/{task_id}` 并展示结果图片
- 生成完成后自动保存本地历史，可在“历史管理”中查看、搜索、打开原图、复制链接或删除记录

## API Key

在页面中填入 APIMart API Key。Key 会保存在当前浏览器的 `localStorage` 中，请求会从浏览器直接发送到 `https://api.apimart.ai`。

## 历史记录

历史记录保存在当前浏览器的 `localStorage` 中，包含任务 ID、prompt、结果图片 URL、费用、耗时和过期时间。图片文件本身不会下载到本地。
