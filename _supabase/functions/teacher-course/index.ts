import { parseDocument } from 'npm:yaml@2.9.1';
import { createPrivateCourseHandler } from './handler.mjs';
import { deploymentEnvironment } from './deployment-config.mjs';

// Déployer avec verify_jwt = true. La fonction vérifie aussi l’identité auprès d’Auth.
Deno.serve(createPrivateCourseHandler({ env: deploymentEnvironment(name => Deno.env.get(name)), parseDocument }));
