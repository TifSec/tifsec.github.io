import { parseDocument } from 'npm:yaml@2.9.1';
import { deploymentEnvironment } from '../teacher-course/deployment-config.mjs';
import { createTeacherCorrectionHandler } from './handler.mjs';

// Déployer avec verify_jwt=true. Ne requiert aucune clé service_role.
Deno.serve(createTeacherCorrectionHandler({ env: deploymentEnvironment(name => Deno.env.get(name)), parseDocument }));
