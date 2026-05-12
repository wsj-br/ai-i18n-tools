import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { FileContentCache } from "../../src/cli/file-content-cache.js";
import { hashFileContent } from "../../src/cli/helpers.js";

describe("FileContentCache", () => {
  let tempDir: string;
  let cache: FileContentCache;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "file-content-cache-test-"));
    cache = new FileContentCache();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("should read file and cache content, hash, and mtime", () => {
    const testFile = path.join(tempDir, "test.md");
    const content = "# Test Content\n\nThis is a test.";
    fs.writeFileSync(testFile, content, "utf8");

    const result1 = cache.readFile(testFile);
    expect(result1.content).toBe(content);
    expect(result1.hash).toBe(hashFileContent(content));
    expect(result1.mtime).toBeDefined();

    // Second read should return cached values
    const result2 = cache.readFile(testFile);
    expect(result2.content).toBe(result1.content);
    expect(result2.hash).toBe(result1.hash);
    expect(result2.mtime).toBe(result1.mtime);

    // Cache should have one entry
    expect(cache.size).toBe(1);
  });

  it("should invalidate cache when file mtime changes", async () => {
    const testFile = path.join(tempDir, "test.md");
    const content1 = "# Version 1";
    fs.writeFileSync(testFile, content1, "utf8");

    const result1 = cache.readFile(testFile);
    expect(result1.content).toBe(content1);

    // Wait a bit to ensure different mtime
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Modify the file
    const content2 = "# Version 2";
    fs.writeFileSync(testFile, content2, "utf8");

    const result2 = cache.readFile(testFile);
    expect(result2.content).toBe(content2);
    expect(result2.hash).toBe(hashFileContent(content2));
    expect(result2.content).not.toBe(result1.content);
  });

  it("should cache multiple files independently", () => {
    const file1 = path.join(tempDir, "file1.md");
    const file2 = path.join(tempDir, "file2.md");

    fs.writeFileSync(file1, "Content 1", "utf8");
    fs.writeFileSync(file2, "Content 2", "utf8");

    cache.readFile(file1);
    cache.readFile(file2);

    expect(cache.size).toBe(2);

    // Both should be cached
    const result1 = cache.readFile(file1);
    const result2 = cache.readFile(file2);
    expect(result1.content).toBe("Content 1");
    expect(result2.content).toBe("Content 2");
  });

  it("should clear all cached entries", () => {
    const file1 = path.join(tempDir, "file1.md");
    const file2 = path.join(tempDir, "file2.md");

    fs.writeFileSync(file1, "Content 1", "utf8");
    fs.writeFileSync(file2, "Content 2", "utf8");

    cache.readFile(file1);
    cache.readFile(file2);
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should handle empty files", () => {
    const testFile = path.join(tempDir, "empty.md");
    fs.writeFileSync(testFile, "", "utf8");

    const result = cache.readFile(testFile);
    expect(result.content).toBe("");
    expect(result.hash).toBe(hashFileContent(""));
    expect(result.mtime).toBeDefined();
  });

  it("should handle large files", () => {
    const testFile = path.join(tempDir, "large.md");
    const largeContent = "x".repeat(1000000); // 1MB of content
    fs.writeFileSync(testFile, largeContent, "utf8");

    const result = cache.readFile(testFile);
    expect(result.content).toBe(largeContent);
    expect(result.hash).toBe(hashFileContent(largeContent));

    // Second read should be from cache
    const result2 = cache.readFile(testFile);
    expect(result2.content).toBe(largeContent);
  });
});
