# TrendRadar 离线可用版

本仓库提供一个**开箱即用的 TrendRadar 单页站点**，无需外部依赖：
- 打开 `index.html` 即可在浏览器内查看雷达图、趋势卡片，并新增/筛选趋势。
- 数据保存到浏览器 LocalStorage，可随时导入/导出 JSON，便于团队共享。
- 保留了 `scripts/import_trendradar.sh`，若未来可访问 GitHub，可用它把官方 TrendRadar 代码导入到本仓库。

## 快速使用
1. 将仓库下载到本地或解压。无须安装任何依赖。
2. 直接用浏览器打开 `index.html`（本地文件即可）。
3. 在页面上：
   - 搜索/筛选趋势；
   - 查看 Radar（动能/相关度/信心度的平均值）；
   - 新增趋势（保存后即写入 LocalStorage）；
   - 导入或导出 JSON 文件，便于协作。

> 提示：浏览器保存的数据是本地隔离的，如需同步请使用导出/导入功能。

## 数据格式
导出的 JSON 是趋势数组，字段示例：
```json
[
  {
    "title": "多模态生成搜索",
    "category": "AI",
    "stage": "试点",
    "momentum": 5,
    "relevance": 5,
    "confidence": 4,
    "description": "将 RAG 与多模态模型结合，用实时数据生成答案与素材。",
    "lastUpdate": "2024-10-01",
    "owner": "产品团队"
  }
]
```
数值字段限定在 1-5，导入时会自动校验并裁剪到有效范围。

## 导入官方 TrendRadar 代码（可选）
如果有 GitHub 访问权限，可以运行脚本将官方仓库内容导入到当前仓库（保留 `.git` 历史）：
```bash
# 从本地已解压目录导入
scripts/import_trendradar.sh --from-dir /path/to/TrendRadar-main --force

# 直接克隆（需要网络）
scripts/import_trendradar.sh --clone https://github.com/ezanzu7559-del/TrendRadar --force
```
当前环境仍会遇到 `CONNECT tunnel failed, response 403` 的网络限制，如无法克隆，请在可联网机器下载源码后用 `--from-dir` 方式导入。
