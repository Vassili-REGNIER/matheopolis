import type {
  InfoContentAttribute,
  InfoContentDocument,
  InfoContentNode,
  InfoContentTag,
  InfoElementContent,
  InfoParagraphContent
} from "../../../models/GameConfig.js";
import { asAttribute, escapeHtml, isRecord } from "../../../utils/dom.js";

const allowedTags = new Set<InfoContentTag>([
  "div",
  "section",
  "article",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "em",
  "strong",
  "small",
  "ul",
  "ol",
  "li",
  "input",
  "label"
]);

const voidTags = new Set<InfoContentTag>(["input"]);
const allowedAttributes = new Set<InfoContentAttribute>([
  "id",
  "type",
  "name",
  "checked",
  "for",
  "aria-label"
]);

export function renderInfoContent(content: InfoContentDocument | InfoContentNode[] | undefined): string {
  if (content === undefined) {
    return "";
  }

  if (Array.isArray(content)) {
    return content.map(renderInfoNode).join("");
  }

  const sections: string[] = [];
  if (content.titre !== undefined) {
    sections.push(`<h1>${escapeHtml(content.titre)}</h1>`);
  }

  if (content.paragraph !== undefined) {
    const paragraphs = Array.isArray(content.paragraph) ? content.paragraph : [content.paragraph];
    sections.push(...paragraphs.map(renderParagraph));
  }

  if (content.nodes !== undefined) {
    sections.push(...content.nodes.map(renderInfoNode));
  }

  return sections.join("");
}

function renderInfoNode(node: InfoContentNode): string {
  if (typeof node === "string") {
    return escapeHtml(node);
  }

  if (node.type === "text") {
    return escapeHtml(node.text);
  }

  if (node.type === "titre") {
    return `<h1>${escapeHtml(node.text)}</h1>`;
  }

  if (node.type === "paragraph") {
    return renderParagraph(node);
  }

  return renderElement(node);
}

function renderParagraph(node: InfoParagraphContent): string {
  return `<div${renderClassName(node.className)}>${node["sous-titre"] !== undefined ? `<h2>${escapeHtml(node["sous-titre"])}</h2>` : ""}${node.text !== undefined ? `<p>${escapeHtml(node.text)}</p>` : ""}${renderChildren(node.children)}</div>`;
}

function renderElement(node: InfoElementContent): string {
  if (!allowedTags.has(node.tag)) {
    return "";
  }

  const attributes = `${renderClassName(node.className)}${renderAttributes(node.attributes)}`;
  if (voidTags.has(node.tag)) {
    return `<${node.tag}${attributes}>`;
  }

  return `<${node.tag}${attributes}>${node.text !== undefined ? escapeHtml(node.text) : ""}${renderChildren(node.children)}</${node.tag}>`;
}

function renderChildren(children: InfoContentNode[] | undefined): string {
  return children === undefined ? "" : children.map(renderInfoNode).join("");
}

function renderClassName(className: string | undefined): string {
  if (className === undefined || !/^[a-zA-Z0-9 _-]+$/.test(className)) {
    return "";
  }

  return ` class="${asAttribute(className)}"`;
}

function renderAttributes(attributes: InfoElementContent["attributes"]): string {
  if (attributes === undefined || !isRecord(attributes)) {
    return "";
  }

  return Object.entries(attributes)
    .filter((entry): entry is [InfoContentAttribute, string | number | boolean] => allowedAttributes.has(entry[0] as InfoContentAttribute))
    .map(([key, value]) => renderAttribute(key, value))
    .join("");
}

function renderAttribute(key: InfoContentAttribute, value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? ` ${key}` : "";
  }

  return ` ${key}="${asAttribute(String(value))}"`;
}
