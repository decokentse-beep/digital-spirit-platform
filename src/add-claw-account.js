const fs = require('fs');

const usersPath = '/mnt/c/Users/decok/Claw/memory/digital-spirit-platform/src/routes/users.js';
let content = fs.readFileSync(usersPath, 'utf8');

const clawUser = `{
        id: 'claw-001', 
        name: 'Claw', 
        email: 'claw@ekbase.gt.tc', 
        password: 'claw2026DigitalSpirit!',
        betaCode: 'BETA000',
        registeredAt: new Date().toISOString(),
        plan: 'ai'
    }`;

content = content.replace(
    /const preUsers = \[/,
    `const preUsers = [\n    ${clawUser},`
);

fs.writeFileSync(usersPath, content);
console.log('✅ Claw account created!');
