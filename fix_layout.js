const fs = require('fs');
const p = 'app/dashboard/layout.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('import { ReactNode, useEffect } from "react";', 'import { ReactNode, useEffect } from "react";\nimport ErrorBoundary from "@/components/ErrorBoundary";\nimport ConnectionStatus from "@/components/ui/ConnectionStatus";');
c = c.replace('{children}', '<ErrorBoundary><ConnectionStatus />{children}</ErrorBoundary>');
fs.writeFileSync(p, c, 'utf8');
console.log('Layout updated fixed');
