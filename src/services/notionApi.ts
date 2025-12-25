export interface NotionPageResult {
  success: boolean;
  pageId: string;
  url: string;
}

export async function createNotionProjectPage(): Promise<NotionPageResult> {
  try {
    const response = await fetch('/api/create-notion-project-page', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create Notion project page');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Notion project page:', error);
    throw error;
  }
}
