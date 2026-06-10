'use client';

import { InternalApi } from '@trylinky/common';
import { Button, toast } from '@trylinky/ui';
import * as Catalyst from '@trylinky/ui/catalyst';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@trylinky/ui/catalyst';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

interface FormGroup {
  blockId: string;
  title: string;
  isDeleted: boolean;
  submissionCount: number;
  latestSubmissionAt: string | null;
}

interface Submission {
  id: string;
  createdAt: string;
  answers: Record<string, string | boolean>;
  fieldsSnapshot: {
    title: string | null;
    fields: { id: string; label: string; type: string }[];
  };
}

interface Column {
  id: string;
  label: string;
}

// Column set is the union of field ids across every snapshot, so responses
// collected before a field was renamed/removed still render. Most recent
// snapshot's label wins.
function deriveColumns(submissions: Submission[]): Column[] {
  const columns = new Map<string, string>();
  // Submissions arrive newest-first; iterate oldest-first so newer labels
  // overwrite older ones.
  for (const submission of [...submissions].reverse()) {
    for (const field of submission.fieldsSnapshot?.fields ?? []) {
      columns.set(field.id, field.label);
    }
  }
  return [...columns.entries()].map(([id, label]) => ({ id, label }));
}

function formatAnswer(value: string | boolean | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value;
}

function escapeCsvValue(value: string): string {
  // Prefix characters Excel/LibreOffice would treat as a formula.
  if (/^[=+\-@\t\r]/.test(value)) {
    value = `'${value}`;
  }
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, columns: Column[], rows: Submission[]) {
  const header = ['Submitted at', ...columns.map((column) => column.label)];
  const body = rows.map((submission) => [
    new Date(submission.createdAt).toISOString(),
    ...columns.map((column) => formatAnswer(submission.answers[column.id])),
  ]);
  const csv = [header, ...body]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SidebarForms() {
  const { cache } = useSWRConfig();
  // Same pattern as SidebarAnalytics.tsx:64 — pageId is seeded into the SWR
  // cache by the editor layout.
  const pageId = cache.get('pageId');

  const fetchIdRef = useRef(0);

  const [groups, setGroups] = useState<FormGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!pageId) return;

    const fetchGroups = async () => {
      setGroupsLoading(true);
      try {
        const response = await InternalApi.get(`/forms/page/${pageId}`);
        const fetchedGroups: FormGroup[] = response?.groups ?? [];
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0) {
          setSelectedBlockId(fetchedGroups[0].blockId);
        }
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchGroups();
  }, [pageId]);

  const fetchSubmissions = useCallback(
    async (blockId: string, cursor?: string) => {
      const fetchId = ++fetchIdRef.current;
      setSubmissionsLoading(true);
      try {
        const params = new URLSearchParams({ blockId });
        if (cursor) params.set('cursor', cursor);
        const response = await InternalApi.get(
          `/forms/page/${pageId}/submissions?${params.toString()}`
        );
        // A newer fetch (e.g. the user switched groups) supersedes this one.
        if (fetchId !== fetchIdRef.current) return;
        setSubmissions((previous) =>
          cursor
            ? [...previous, ...(response?.submissions ?? [])]
            : (response?.submissions ?? [])
        );
        setNextCursor(response?.nextCursor ?? null);
      } finally {
        if (fetchId === fetchIdRef.current) {
          setSubmissionsLoading(false);
        }
      }
    },
    [pageId]
  );

  useEffect(() => {
    if (!selectedBlockId || !pageId) return;
    setSubmissions([]);
    setNextCursor(null);
    fetchSubmissions(selectedBlockId);
  }, [selectedBlockId, pageId, fetchSubmissions]);

  const handleDelete = async (submissionId: string) => {
    if (!window.confirm('Delete this response? This cannot be undone.')) {
      return;
    }

    const response = await InternalApi.delete(
      `/forms/submissions/${submissionId}`
    );

    if (response?.success) {
      setSubmissions((previous) =>
        previous.filter((submission) => submission.id !== submissionId)
      );
      setGroups((previous) =>
        previous.map((group) =>
          group.blockId === selectedBlockId
            ? { ...group, submissionCount: group.submissionCount - 1 }
            : group
        )
      );
    } else {
      toast({
        title: 'Could not delete the response. Please try again.',
        variant: 'error',
      });
    }
  };

  const handleExport = async () => {
    if (!selectedBlockId || !pageId) return;
    setIsExporting(true);
    try {
      // Fetch every page so the CSV contains all responses, not just the
      // ones currently loaded.
      const allSubmissions: Submission[] = [];
      let cursor: string | null = null;
      do {
        const params = new URLSearchParams({ blockId: selectedBlockId });
        if (cursor) params.set('cursor', cursor);
        const response = await InternalApi.get(
          `/forms/page/${pageId}/submissions?${params.toString()}`
        );
        allSubmissions.push(...(response?.submissions ?? []));
        cursor = response?.nextCursor ?? null;
      } while (cursor);

      const group = groups.find((g) => g.blockId === selectedBlockId);
      const slug = (group?.title || 'form')
        .replace(/[^a-z0-9]+/gi, '-')
        .toLowerCase();
      downloadCsv(
        `${slug}-responses.csv`,
        deriveColumns(allSubmissions),
        allSubmissions
      );
    } catch {
      toast({
        title: 'Export failed part-way through. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (groupsLoading) {
    return (
      <div className="flex min-h-[360px] w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
      </div>
    );
  }

  if (groups.length === 0) {
    return <SidebarFormsEmpty />;
  }

  const columns = deriveColumns(submissions);
  const selectedGroup = groups.find(
    (group) => group.blockId === selectedBlockId
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <button
            key={group.blockId}
            type="button"
            onClick={() => setSelectedBlockId(group.blockId)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              group.blockId === selectedBlockId
                ? 'border-stone-800 bg-stone-100 font-medium'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            {group.title}
            {group.isDeleted && ' (deleted form)'}
            <span className="ml-2 text-stone-500">
              {group.submissionCount}
            </span>
          </button>
        ))}
      </div>

      {selectedGroup && (
        <div className="flex items-center justify-between">
          <Catalyst.Text>
            {selectedGroup.submissionCount}{' '}
            {selectedGroup.submissionCount === 1 ? 'response' : 'responses'}
            {selectedGroup.latestSubmissionAt &&
              ` · latest ${new Date(
                selectedGroup.latestSubmissionAt
              ).toLocaleString()}`}
          </Catalyst.Text>
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || selectedGroup.submissionCount === 0}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      )}

      {submissions.length === 0 && !submissionsLoading ? (
        <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50">
          <Catalyst.Text>No responses yet.</Catalyst.Text>
        </div>
      ) : (
        <Table dense className="w-full">
          <TableHead>
            <TableRow>
              <TableHeader>Submitted</TableHeader>
              {columns.map((column) => (
                <TableHeader key={column.id}>{column.label}</TableHeader>
              ))}
              <TableHeader>
                <span className="sr-only">Actions</span>
              </TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="whitespace-nowrap text-stone-500">
                  {new Date(submission.createdAt).toLocaleString()}
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className="max-w-[240px] truncate"
                    title={formatAnswer(submission.answers[column.id])}
                  >
                    {formatAnswer(submission.answers[column.id])}
                  </TableCell>
                ))}
                <TableCell>
                  <button
                    type="button"
                    aria-label="Delete response"
                    onClick={() => handleDelete(submission.id)}
                    className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {nextCursor && (
        <Button
          type="button"
          variant="secondary"
          disabled={submissionsLoading}
          onClick={() =>
            selectedBlockId && fetchSubmissions(selectedBlockId, nextCursor)
          }
        >
          {submissionsLoading && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Load more
        </Button>
      )}
    </div>
  );
}

function SidebarFormsEmpty() {
  return (
    <div className="flex min-h-[360px] w-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50 p-12">
      <div className="flex max-w-md flex-col items-center text-center">
        <Catalyst.Heading level={2} className="mb-2">
          No forms on this page yet
        </Catalyst.Heading>
        <Catalyst.Text className="text-pretty">
          Add a Form block to your page in the editor to start collecting
          responses from your visitors. They&apos;ll show up here.
        </Catalyst.Text>
      </div>
    </div>
  );
}
