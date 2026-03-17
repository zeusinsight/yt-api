# RapidAPI Setup Guide

## 1. Create your API on RapidAPI

1. Go to https://rapidapi.com/studio
2. Click **"Add New API"**
3. Fill in:
   - **Name**: `YouTube Toolkit` (or whatever sounds good)
   - **Description**: "Fast YouTube transcript, metadata, search, comments & channel data API. No YouTube API quota needed."
   - **Category**: Data
   - **Base URL**: `http://YOUR_SERVER_IP:3000`

## 2. Add Endpoints

Add each endpoint in the RapidAPI dashboard:

### GET /transcript
- **Parameters**: `url` (required), `lang` (optional, default: "en")
- **Description**: Get video transcript/subtitles with timestamps

### GET /info
- **Parameters**: `url` (required)
- **Description**: Get complete video metadata (title, description, duration, views, likes, tags, thumbnails, formats)

### GET /search
- **Parameters**: `q` (required), `limit` (optional, default: 10, max: 50)
- **Description**: Search YouTube videos without API quota

### GET /comments
- **Parameters**: `url` (required), `limit` (optional, default: 20, max: 100)
- **Description**: Extract video comments with author, text, likes

### GET /channel
- **Parameters**: `name` (required)
- **Description**: Get channel information from a channel name or handle

## 3. Pricing Plans

Set up in **Monetization** tab:

| Plan | Price | Rate Limit | Daily Limit |
|------|-------|-----------|-------------|
| Free | $0 | 5/min | 50/day |
| Basic | $9.99/mo | 20/min | 1,000/day |
| Pro | $49.99/mo | 60/min | 10,000/day |
| Ultra | $199.99/mo | 200/min | Unlimited |

## 4. RapidAPI Gateway Setup

In **Settings > Gateway**:
- Set **Base URL** to your server IP: `http://YOUR_SERVER_IP:3000`
- RapidAPI will proxy all requests through their gateway
- They handle auth (X-RapidAPI-Key header) automatically

## 5. Optimize your listing

- Add example responses for each endpoint
- Write a clear long description with use cases:
  - "Perfect for AI apps that need YouTube transcripts"
  - "No YouTube Data API quota required"
  - "Supports 100+ languages for transcripts"
- Add tags: youtube, transcript, video, metadata, scraping, subtitles, search
