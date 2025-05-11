#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import figlet from 'figlet';
import boxen from 'boxen';

async function init() {
  // Fancy header
  console.log(
    boxen(
      figlet.textSync('CREATE SERVER STARTER', { horizontalLayout: 'default' }),
      {
        padding: 1,
        borderColor: 'green',
        margin: 1,
        align: 'center',
      }
    )
  );

  console.log(chalk.green("\n🛠️ Backend Project Scaffolder for Node"));

  const { projectName, dbChoice } = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Enter project folder name:",
      default: "my-create-server-starter"
    },
    {
      type: "list",
      name: "dbChoice",
      message: "Choose a database:",
      choices: ["MongoDB (Mongoose)", "PostgreSQL (Sequelize)", "None"]
    }
  ]);

  const projectPath = path.join(process.cwd(), projectName);
  await fs.ensureDir(projectPath);
  process.chdir(projectPath);

  // Spinner: Creating folders
  const folderSpinner = ora("📁 Creating folder structure...").start();
  const folders = [
    "public",
    "src/controllers",
    "src/db",
    "src/middlewares",
    "src/models",
    "src/routes",
    "src/utils"
  ];
  for (const folder of folders) {
    await fs.ensureDir(path.join(projectPath, folder));
  }
  folderSpinner.succeed("📁 Folder structure created.");

  // Spinner: Creating base files
  const fileSpinner = ora("📄 Creating base files...").start();
  const files = {
    "src/app.js": `const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Server is up and running!');
});

module.exports = app;
`,
    "src/index.js": `const app = require('./app');
const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,
    "src/constants.js": "module.exports = { APP_NAME: 'My Backend App' };\n",
    ".gitignore": "node_modules\n.env\n",
    ".env": "PORT=3000\nDB_URI=your_database_uri_here\n",
    ".env.sample": "PORT=3000\nDB_URI=sample_database_uri\n",
    ".prettierrc": "{\n  \"semi\": true,\n  \"singleQuote\": true\n}\n",
    ".prettierignore": "node_modules\n",
    "README.md": `# ${projectName}\n\nGenerated using custom backend CLI.`
  };

  for (const [file, content] of Object.entries(files)) {
    await fs.outputFile(path.join(projectPath, file), content);
  }
  fileSpinner.succeed("📄 Base files created.");

  // Spinner: Init npm
  const npmSpinner = ora("📦 Initializing npm project...").start();
  await execa("npm", ["init", "-y"]);
  const pkgPath = path.join(projectPath, "package.json");
  const pkg = await fs.readJson(pkgPath);
  pkg.scripts = {
    ...pkg.scripts,
    dev: "nodemon src/index.js",
    start: "node src/index.js",
    format: "prettier --write ."
  };
  await fs.writeJson(pkgPath, pkg, { spaces: 2 });
  npmSpinner.succeed("📦 npm initialized.");

  // Install dependencies
  const installSpinner = ora("📥 Installing dependencies...").start();
  const dependencies = ["express", "dotenv", "cors"];
  const devDependencies = ["nodemon", "prettier", "ora", "figlet", "boxen"];

  if (dbChoice === "MongoDB (Mongoose)") dependencies.push("mongoose");
  if (dbChoice === "PostgreSQL (Sequelize)") dependencies.push("sequelize", "pg", "pg-hstore");

  await execa("npm", ["install", ...dependencies]);
  await execa("npm", ["install", "-D", ...devDependencies]);
  installSpinner.succeed("📥 Dependencies installed.");

  // Final message
  console.log(chalk.green("\n✅ Backend project setup complete!"));
  console.log(chalk.yellow(`\n👉 To get started:`));
  console.log(chalk.cyan(`   cd ${projectName} && npm run dev\n`));
}

init();
