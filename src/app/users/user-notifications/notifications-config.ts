export const NOTIFICATIONS_CONFIG = {
	PROJECT_MANAGER: [
		{
			label: 'Task was added/removed to the column (after subscription to a column)',
			key: 'CHANGE_TASK_COLUMN',
		},
		{
			label: 'Were tagged in a comment',
			key: 'TAGGED_IN_COMMENT'
		},
		{
			label: 'Were tagged in a task',
			key: 'TAGGED_IN_TASK'
		},
		{
			label: 'New reply to your comment',
			key: 'COMMENT_REPLY'
    },
    // Item has been removed according to USR-129 task (we do not have functionality for this option)
		// {
		// 	label: 'Task that you subscribed to has updates',
		// 	key: 'TASK_UPDATED'
		// },
		{
			label: 'New task was assigned to you',
			key: 'TASK_ASSIGNED'
		}
	],
	MARKETPLACE: [
		{
			label: 'Your developing request was approved',
			key: 'DEV_REQUEST_APPROVED'
		},
		{
			label: 'Your publish request was approved',
			key: 'PUB_REQUEST_APPROVED'
		},
		{
			label: 'Your request was rejected',
			key: 'DEV_REQUEST_REJECTED'
		}
	],
	SMART_INFRASTRUCTURE: [
		{
			label: 'Task you created is now in progress',
			key: 'TASK_IN_PROGRESS'
		},
		{
			label: 'Task you created has an Error',
			key: 'TASK_ERROR'
		},
		{
			label: 'Task you created was completed',
			key: 'TASK_COMPLETED'
		},
		{
			label: 'Task you created Failed to be completed',
			key: 'TASK_FAILED'
		},
		{
			label: 'Robot proceeded to charge',
			key: 'ROBOT_CHARGE'
		}
  ],
}

export class ChangesData {
  org: any;
  service?: any;
  action?: any;
  type: string;
  value: boolean;
}
