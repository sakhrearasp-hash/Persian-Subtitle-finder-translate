#!/bin/bash
sed -i '196,197c\
      const data = await response.json();\
      const remainingTokens = response.headers.get("x-ratelimit-remaining-tokens-minute") || response.headers.get("x-ratelimit-remaining-tokens");\
      return { content: data.choices[0].message.content, remainingTokens, usage: data.usage };' server.ts
