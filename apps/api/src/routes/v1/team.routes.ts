import { Router } from 'express';
import { teamController } from '../../app/controllers/TeamController';
import { authMiddleware } from '../../app/middleware/auth';
import { tenantMiddleware } from '../../app/middleware/tenant';

const router = Router();
router.use(authMiddleware, tenantMiddleware);

// GET  /v1/team                        — list all org members
router.get('/',                      teamController.listMembers.bind(teamController));

// POST /v1/team                        — invite / create a new member
router.post('/',                     teamController.inviteMember.bind(teamController));

// PATCH /v1/team/:userId/role          — change a member's role
router.patch('/:userId/role',        teamController.updateMemberRole.bind(teamController));

// DELETE /v1/team/:userId              — remove a member
router.delete('/:userId',            teamController.removeMember.bind(teamController));

// GET  /v1/team/:memberId/assignments  — get businesses assigned to member
router.get('/:memberId/assignments',  teamController.getMemberAssignments.bind(teamController));

// PUT  /v1/team/:memberId/assignments  — replace all assignments for member
router.put('/:memberId/assignments',  teamController.setMemberAssignments.bind(teamController));

export default router;
