import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { TaskNodeEmbed } from '../components/TaskNodeEmbed';

export interface JiraTaskOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    jiraTask: {
      /**
       * Insert a Jira task
       */
      setJiraTask: (attributes: {
        taskId: string;
        title: string;
        status: string;
        assignee?: string;
      }) => ReturnType;
    };
  }
}

export const JiraTask = Node.create<JiraTaskOptions>({
  name: 'jiraTask',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      taskId: {
        default: null,
      },
      title: {
        default: null,
      },
      status: {
        default: 'Unknown',
      },
      assignee: {
        default: 'Unassigned',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="jira-task"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'jira-task' })];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addNodeView(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ReactNodeViewRenderer(TaskNodeEmbed as any);
  },

  addCommands() {
    return {
      setJiraTask:
        (attributes) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
