const actions = {
  'PROJECT_MANAGER': [
    'CHANGE_TASK_COLUMN',  // Project-manager: Task was added/removed to the column (after subscription to a column)
    'TAGGED_IN_COMMENT',   // Project-manager: Were tagged in a comment
    'TAGGED_IN_TASK',      // Project-manager: Were tagged in a task
    'COMMENT_REPLY',       // Project-manager: New reply to your comment
    'TASK_UPDATED',        // Project-manager: Task that you subscribed to has updates
    'TASK_ASSIGNED',       // Project-manager: New task was assigned to you
  ],
  'MARKETPLACE': [
    'DEV_REQUEST_APPROVED', // Marketplace: Your developing request was approved.
    'PUB_REQUEST_APPROVED', // Marketplace: Your publish request was approved.
    'DEV_REQUEST_REJECTED', // Marketplace: Your request was rejected.
  ],
  'SMART_INFRASTRUCTURE': [
    'TASK_IN_PROGRESS', // Smart Infrastructure: Task you created is now in progress.
    'TASK_ERROR', // Smart Infrastructure: Task you created has an Error.
    'TASK_COMPLETED', // Smart Infrastructure: Task you created was completed.
    'TASK_FAILED', // Smart Infrastructure: Task you created Failed to be completed.
    'ROBOT_CHARGE', // Smart Infrastructure: Robot proceeded to charge.
  ]
};

const notificationConfig = {
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
};

const getAllActionsEnum = () => {
  const enums = [];
  Object.keys(actions).forEach((key) => {
    enums.push(...actions[key]);
  });
  return enums;
}

module.exports = {
  actionsObj: actions,
  notificationConfig,
  getAllActionsEnum
}
