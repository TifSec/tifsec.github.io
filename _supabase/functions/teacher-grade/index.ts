import { parseDocument } from 'npm:yaml@2.9.1';
import { deploymentEnvironment } from '../teacher-course/deployment-config.mjs';
import { createTeacherGradeHandler } from './handler.mjs';

// Préparé uniquement. Déployer verify_jwt=true après accord sur le lot de notation.
Deno.serve(createTeacherGradeHandler({ env: deploymentEnvironment(name => Deno.env.get(name)), parseDocument }));
