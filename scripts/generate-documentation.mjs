#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tempo from '@joggr/tempo';
import _ from 'lodash';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_PATH_ROOT = path.join(__dirname, '..');
const FILE_PATH_README = path.join(FILE_PATH_ROOT, 'README.md');
const DIR_PATH_DOCS = path.resolve(FILE_PATH_ROOT, 'docs');
const DIR_PATH_HELPERS = path.resolve(FILE_PATH_ROOT, 'helpers');

const COMMENT_START = '<!-- docs:start -->';
const COMMENT_END = '<!-- docs:end -->';

/**
 * Directories that are available for documentation generation
 * 
 * @typedef {{title: string, summary: string, helperId: string, sections: string[]}} HelperConfig 
 * @type {Array<HelperConfig>}
 */
const helperConfigs = [
  {
    title: '🐳 Docker',
    summary: 'Helpful scripts, tools, and resources for working with Docker.',
    helperId: 'docker',
    sections: ['scripts']
  },
];

/*
|------------------
| Utils
|------------------
*/

/**
 * Read the names of the bash scripts in a directory
 * 
 * @param {string} dirPath 
 * @returns {string[]} 
 */
const readHelperScriptFileNames = (dirPath) => {
  const files = fs.readdirSync(path.join(DIR_PATH_HELPERS, dirPath));
  const scripts = files.filter((file) => file.endsWith('.sh'));
  return scripts;
};

/**
 * Extract the documentation data from a bash script
 * 
 * @param {string} filePath
 * @typedef {{title: string, summary: string, description: string, example: string, source: string}} BashScriptDocsData
 * @returns {BashScriptDocsData}
 */
const extractBashScriptDocsData = (filePath) => {
  const rawFileContent = fs.readFileSync(path.join(DIR_PATH_HELPERS, filePath), 'utf8')
  const fileContent = rawFileContent.replace('#!/usr/bin/env bash\n', '')

  const splitOnHeaderTitleDividers = fileContent
    .split('#==========================================================================\n')
    .filter(x => x !== '' && x !== '\n');

  const fullTitle = splitOnHeaderTitleDividers[0].replace('# ', '').replace('\n', '');
  const [title, summary] = fullTitle.split(' - ');
  const description = splitOnHeaderTitleDividers[1]
    .split('# @description:')[1]
    .split('# @example:')[0]
    .replace(/#\s\s/g, '')
    .replace(/#\s/g, '')
    .trim();
  const example = splitOnHeaderTitleDividers[1]
    .split('# @example:')[1]
    .split('#--------------------------------------------------------------------------\n')[0]
    .replace(/#\s\s/g, '')
    .replace(/#\s/g, '')
    .trim();

  return {
    source: rawFileContent,
    title,
    summary,
    description,
    example
  };
};

/**
 * Get the data for generating the documentation
 * 
 * @typedef {{helper: string, file: string, section: string} & BashScriptDocsData} Doc
 * @typedef {{title: string, summary: string, helperId: string, docs: Doc[]}} TableOfContents
 * 
 * @returns {{toc: TableOfContents[], docs: Doc[]}}
 */
const getGenerationData = () => {
  /** @type {TableOfContents[]} */
  const tableOfContents = [];
  /** @type {Doc[]} */
  const docs = [];

  for (const generateItem of helperConfigs) {
    /** @type {TableOfContents} */
    const tableOfContentsItem = {
      title: generateItem.title,
      summary: generateItem.summary,
      helperId: generateItem.helperId,
      docs: []
    };

    for (const docSection of generateItem.sections) {
      const scriptNames = readHelperScriptFileNames(path.join(generateItem.helperId, docSection));
      for (const scriptName of scriptNames) {
        if (scriptName.includes('.sh')) {
          const docsData = extractBashScriptDocsData(path.join(generateItem.helperId, docSection, scriptName));
          const docFileName = `${_.kebabCase(scriptName.replace('.sh', ''))}.md`;
          const doc = {
            ...docsData,
            helper: generateItem.helperId,
            section: docSection, 
            file: docFileName
          };

          docs.push(doc);
          tableOfContentsItem.docs.push(doc); 
        } else {
          process.stderr.write('ERROR: Only bash scripts supported');
          process.exit(1);
        }
      }
    }
    tableOfContents.push(tableOfContentsItem);
  }

  return {
    toc: tableOfContents,
    docs
  };
};

/**
 * Write the section readmes
 * 
 * @param {Doc[]} docs
 */
const writeSectionReadmes = (docs) => {
  const groupedDocs = _.groupBy(docs, (doc) => doc.helper);

  for (const [helper, helperDocs] of Object.entries(groupedDocs)) {
    const helperConfig = helperConfigs.find((config) => config.helperId === helper);

    if (!helperConfig) {
      process.stderr.write(`ERROR: No helper config found for ${helper}`);
      process.exit(1);
    }

    const content = tempo.default()
      .h1(helperConfig.title)
      .paragraph(helperConfig.summary)
      .h2('Table of Contents')
      .bulletList(helperDocs.map((helperDoc) => {
        return (txt) => txt.link(helperDoc.title, `./${helperDoc.section}/${helperDoc.file}`).plainText(': ').plainText(helperDoc.summary);
      }));

    fs.writeFileSync(path.join(DIR_PATH_DOCS, helper, 'README.md'), content.toString());
  }
};

/**
 * Write the documentation files
 * 
 * @param {Doc[]} docs 
 */
const writeDocs = (docs) => {
  for (const doc of docs) {
    const content = tempo.default()
      .h1(doc.title)
      .paragraph(doc.summary)
      .h2('Description')
      .paragraph(doc.description)
      .h2('Usage')
      .paragraph(doc.example)
      .h2('Script')
      .codeBlock(doc.source, 'bash')
      .paragraph(
        (txt) => txt.link('View Script', `../../../helpers/${doc.helper}/${doc.section}/${doc.file.replace('.md', '.sh')}`)
      );

    const dirPath = path.join(DIR_PATH_DOCS, doc.helper, doc.section);
    const fullPath = path.join(dirPath, doc.file);
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(fullPath, content.toString());
  }
};

/**
 * Write the table of contents to the main README
 * 
 * @param {TableOfContents[]} tableOfContents 
 */
const writeReadmeToc = (tableOfContents) => {
  const content = tempo.default();

  for (const item of tableOfContents) {
    content
      .h3((txt) => txt.link(item.title, `./docs/${[item.helperId]}/README.md`))
      .paragraph(item.summary)
      .bulletList(item.docs.map((doc) => {
        const filePath = path.join(doc.helper, doc.section, doc.file);
        return (txt) => txt.link(doc.title, `./docs/${filePath}`).plainText(': ').plainText(doc.summary);
      }));
  }

  const readme = fs.readFileSync(FILE_PATH_README, 'utf8');
  const splitReadme = readme.split(COMMENT_START);
  const splitReadmeEnd = splitReadme[1].split(COMMENT_END);
  const newReadme = `${splitReadme[0]}${COMMENT_START}\n${content.toString()}\n${COMMENT_END}${splitReadmeEnd[1]}`;

  // Write the new README
  fs.writeFileSync(FILE_PATH_README, newReadme);
};

/*
|------------------
| Scripts
|------------------
*/

const run = () => {
  process.stdout.write('📚 Building docs...\n');
  try {
    const { toc, docs } = getGenerationData()
    
    // Update the README table of contents
    writeReadmeToc(toc);
    // Write the docs
    writeDocs(docs);
    // Write Section Readmes      
    writeSectionReadmes(docs);

    process.stdout.write('✅ Completed Building Docs\n');
  } catch (error) {
    process.stderr.write(`❌ Error: ${error.message}\n`);
    process.exit(1);
  }
};
run();