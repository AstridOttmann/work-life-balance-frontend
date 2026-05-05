# Tracking Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live Work/Free time tracker tab to the web frontend that persists time blocks to the backend via a nullable `endTime` field.

**Architecture:** `endTime` becomes nullable in the backend (`TimeBlock` entity + DTO + `EntryService` null-guards). The frontend `TrackingPage` manages two `TrackerState` objects locally — Start POSTs a block immediately (no `endTime`), Stop PUTs it with `endTime`. Running blocks (null `endTime`) display "Running" in the Daily Log edit form via the existing `TimeBlockList`. Work and Free timers are mutually exclusive: only one can be *running* at a time (one may be paused while the other runs).

**Tech Stack:** Spring Boot 3 / Java 21 (backend), React 19 / MUI v9 / TypeScript / dayjs (frontend), H2 (test DB), PostgreSQL 16 (dev DB).

**Branch:** `feature/tracking` (branched from `feature/auth` — all auth changes included).

---

## File Map

**Backend — modified:**
- `src/main/java/com/worklifebalance/model/TimeBlock.java` — `endTime` column nullable
- `src/main/java/com/worklifebalance/dto/TimeBlockDto.java` — remove `@NotNull` from `endTime`, add `@JsonInclude(NON_NULL)`
- `src/main/java/com/worklifebalance/service/EntryService.java` — null-guard `endTime` in duration computations

**Backend — created:**
- `src/test/java/com/worklifebalance/TimeBlockControllerTest.java` — integration tests for nullable endTime

**Frontend — modified:**
- `src/types/entry.ts` — `TimeBlock.endTime: string | null`, `TimeBlockInput.endTime?: string`
- `src/components/TimeBlockList.tsx` — show "Running" chip for null-endTime blocks, hide Edit button for running blocks
- `src/App.tsx` — add third "Tracking" tab

**Frontend — created:**
- `src/pages/TrackingPage.tsx` — timer page with two tracker cards and today's summary

---

## Task 1: Backend — nullable endTime (TDD)

Work in: `C:\Users\aottmann\interns\work-life-balance-backend`

**Files:**
- Create: `src/test/java/com/worklifebalance/TimeBlockControllerTest.java`
- Modify: `src/main/java/com/worklifebalance/model/TimeBlock.java`
- Modify: `src/main/java/com/worklifebalance/dto/TimeBlockDto.java`
- Modify: `src/main/java/com/worklifebalance/service/EntryService.java`

- [ ] **Step 1: Write the failing test**

Create `src/test/java/com/worklifebalance/TimeBlockControllerTest.java`:

```java
package com.worklifebalance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worklifebalance.dto.DailyEntryDto;
import com.worklifebalance.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TimeBlockControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private String registerAndGetToken(String email) throws Exception {
        var req = new RegisterRequest();
        req.setEmail(email);
        req.setPassword("password123");
        String body = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("token").asText();
    }

    @Test
    void createTimeBlock_withoutEndTime_returns201() throws Exception {
        String token = registerAndGetToken("tracker@example.com");

        var entry = new DailyEntryDto();
        entry.setDate(LocalDate.of(2026, 5, 5));
        entry.setMood(5.0);
        String entryBody = mockMvc.perform(post("/api/entries")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(entry)))
                .andReturn().getResponse().getContentAsString();
        long entryId = objectMapper.readTree(entryBody).get("id").asLong();

        // Start: no endTime
        String startJson = String.format(
                "{\"dailyEntryId\":%d,\"type\":\"WORK\",\"startTime\":\"09:00:00\"}", entryId);

        String blockBody = mockMvc.perform(post("/api/time-blocks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(startJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.endTime").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        long blockId = objectMapper.readTree(blockBody).get("id").asLong();

        // Stop: add endTime
        String stopJson = String.format(
                "{\"dailyEntryId\":%d,\"type\":\"WORK\",\"startTime\":\"09:00:00\",\"endTime\":\"10:30:00\"}", entryId);

        mockMvc.perform(put("/api/time-blocks/" + blockId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(stopJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.endTime").value("10:30:00"));
    }
}
```

- [ ] **Step 2: Run test — verify it fails**

```bash
./mvnw test -Dtest=TimeBlockControllerTest -q
```

Expected: FAIL — validation rejects the missing `endTime` with 400, but test expects 201.

- [ ] **Step 3: Make endTime nullable in the entity**

In `src/main/java/com/worklifebalance/model/TimeBlock.java`, change:

```java
@Column(nullable = true)
private LocalTime endTime;
```

- [ ] **Step 4: Remove @NotNull from DTO and add @JsonInclude(NON_NULL)**

Replace `src/main/java/com/worklifebalance/dto/TimeBlockDto.java` entirely:

```java
package com.worklifebalance.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TimeBlockDto {
    private Long id;

    @NotNull
    private Long dailyEntryId;

    @NotBlank
    private String type;

    @NotNull
    private LocalTime startTime;

    private LocalTime endTime;   // nullable — omitted from JSON when null
}
```

- [ ] **Step 5: Null-guard endTime in EntryService**

In `src/main/java/com/worklifebalance/service/EntryService.java`, make these two edits:

**In `toDto()`** — add `&& b.getEndTime() != null` to both stream filters:

```java
double compWork = entry.getTimeBlocks().stream()
        .filter(b -> "WORK".equals(b.getType()) && b.getEndTime() != null)
        .mapToDouble(b -> minutesBetween(b) / 60.0).sum();
double compFree = entry.getTimeBlocks().stream()
        .filter(b -> "FREE".equals(b.getType()) && b.getEndTime() != null)
        .mapToDouble(b -> minutesBetween(b) / 60.0).sum();
```

**In `getSummary()`** — add the same null-guard to the work and free totals:

```java
summary.setTotalWorkHours(entries.stream().mapToDouble(e ->
        e.getTimeBlocks().isEmpty() ? orZero(e.getWorkHours())
        : e.getTimeBlocks().stream()
                .filter(b -> "WORK".equals(b.getType()) && b.getEndTime() != null)
                .mapToDouble(b -> minutesBetween(b) / 60.0).sum()
).sum());
summary.setTotalFreeTimeHours(entries.stream().mapToDouble(e ->
        e.getTimeBlocks().isEmpty() ? orZero(e.getFreeTimeHours())
        : e.getTimeBlocks().stream()
                .filter(b -> "FREE".equals(b.getType()) && b.getEndTime() != null)
                .mapToDouble(b -> minutesBetween(b) / 60.0).sum()
).sum());
```

- [ ] **Step 6: Run test — verify it passes**

```bash
./mvnw test -Dtest=TimeBlockControllerTest -q
```

Expected: BUILD SUCCESS, 1 test passed.

- [ ] **Step 7: Run all tests**

```bash
./mvnw test -q
```

Expected: BUILD SUCCESS, all tests pass.

- [ ] **Step 8: Drop NOT NULL constraint in local Postgres**

With Docker Compose running (`docker compose up -d` from the backend dir):

```bash
docker compose exec db psql -U wlb -d worklifebalance -c "ALTER TABLE time_block ALTER COLUMN end_time DROP NOT NULL;"
```

If the Postgres service name is not `db`, check with `docker compose ps` and substitute the correct name.

Expected output: `ALTER TABLE`

- [ ] **Step 9: Commit**

```bash
git add src/main/java/com/worklifebalance/model/TimeBlock.java \
        src/main/java/com/worklifebalance/dto/TimeBlockDto.java \
        src/main/java/com/worklifebalance/service/EntryService.java \
        src/test/java/com/worklifebalance/TimeBlockControllerTest.java
git commit -m "feat: make TimeBlock.endTime nullable to support live tracking"
git push
```

---

## Task 2: Frontend — types + TimeBlockList (committed together)

Work in: `C:\Users\aottmann\interns\work-life-balance-frontend`

**Files:**
- Modify: `src/types/entry.ts`
- Modify: `src/components/TimeBlockList.tsx`

- [ ] **Step 1: Update types**

In `src/types/entry.ts`, change only `TimeBlock` and `TimeBlockInput` — leave everything else:

```typescript
export interface TimeBlock {
  id: number;
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime: string | null;   // null while tracker is running
}

export interface TimeBlockInput {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  startTime: string;
  endTime?: string;          // omitted when starting a tracker
}
```

- [ ] **Step 2: Update TimeBlockList**

Replace `src/components/TimeBlockList.tsx` entirely:

```tsx
import { useState } from 'react';
import {
  Box, Button, Chip, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, List, ListItem, ListItemText, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { TimeBlock, TimeBlockInput } from '../types/entry';
import TimeBlockForm from './TimeBlockForm';
import { timeBlocksApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  dailyEntryId: number;
  type: 'WORK' | 'FREE';
  blocks: TimeBlock[];
  onChange: () => void;
  label: string;
}

function blockDuration(b: TimeBlock): string {
  if (!b.endTime) return '';
  const [sh, sm] = b.startTime.split(':').map(Number);
  const [eh, em] = b.endTime.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TimeBlockList({ dailyEntryId, type, blocks, onChange, label }: Props) {
  const [localBlocks, setLocalBlocks] = useState<TimeBlock[]>(blocks);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimeBlock | null>(null);
  const { toast } = useToast();
  const color = type === 'WORK' ? '#1976d2' : '#4caf50';

  const handleCreate = async (data: TimeBlockInput) => {
    const created = await timeBlocksApi.create(data);
    setAddOpen(false);
    setLocalBlocks(prev => [...prev, created]);
    toast.success(`${label} block added`);
    onChange();
  };

  const handleUpdate = async (data: TimeBlockInput) => {
    if (!editTarget) return;
    const updated = await timeBlocksApi.update(editTarget.id, data);
    setEditTarget(null);
    setLocalBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
    toast.success('Updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await timeBlocksApi.delete(id);
    setLocalBlocks(prev => prev.filter(b => b.id !== id));
    toast.success('Deleted');
    onChange();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color }}>{label}</Typography>
        <Button startIcon={<AddIcon />} size="small" onClick={() => setAddOpen(true)}>Add</Button>
      </Box>

      {localBlocks.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No entries</Typography>
      ) : (
        <List disablePadding>
          {localBlocks.map((b, i) => (
            <Box key={b.id}>
              {i > 0 && <Divider />}
              <ListItem
                disablePadding
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {b.endTime !== null && (
                      <IconButton size="small" onClick={() => setEditTarget(b)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleDelete(b.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    b.endTime === null ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{b.startTime.substring(0, 5)}</span>
                        <Chip label="Running" size="small" color="success" />
                      </Box>
                    ) : (
                      `${b.startTime.substring(0, 5)} – ${b.endTime.substring(0, 5)}`
                    )
                  }
                  secondary={b.endTime !== null ? blockDuration(b) : null}
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add {label} Block</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TimeBlockForm dailyEntryId={dailyEntryId} type={type} onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit {label} Block</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {editTarget && (
              <TimeBlockForm dailyEntryId={dailyEntryId} type={type} initial={editTarget} onSave={handleUpdate} onCancel={() => setEditTarget(null)} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/entry.ts src/components/TimeBlockList.tsx
git commit -m "feat: support nullable endTime — show Running chip in TimeBlockList"
git push
```

---

## Task 3: Frontend — TrackingPage

Work in: `C:\Users\aottmann\interns\work-life-balance-frontend`

**Files:**
- Create: `src/pages/TrackingPage.tsx`

- [ ] **Step 1: Create TrackingPage**

Create `src/pages/TrackingPage.tsx`:

```tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Box, Button, Chip, Paper, Stack, Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import WorkIcon from '@mui/icons-material/Work';
import SpaIcon from '@mui/icons-material/Spa';
import dayjs from 'dayjs';
import { entriesApi, timeBlocksApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { DailyEntry } from '../types/entry';

interface TrackerState {
  status: 'idle' | 'running' | 'paused';
  blockId: number | null;
  dailyEntryId: number | null;
  startTime: string | null;      // "HH:mm" — for PUT on Stop
  startTimestamp: number | null; // Date.now() when last started or resumed
  accumulatedMs: number;         // ms elapsed before last pause
}

const IDLE: TrackerState = {
  status: 'idle',
  blockId: null,
  dailyEntryId: null,
  startTime: null,
  startTimestamp: null,
  accumulatedMs: 0,
};

function elapsedMs(t: TrackerState): number {
  const running = t.status === 'running' && t.startTimestamp != null
    ? Date.now() - t.startTimestamp : 0;
  return t.accumulatedMs + running;
}

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatHM(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function parseTimeAsToday(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function calcTodaySummary(entry: DailyEntry | null) {
  const blocks = entry?.timeBlocks.filter(b => b.endTime !== null) ?? [];
  const sum = (type: 'WORK' | 'FREE') =>
    blocks.filter(b => b.type === type).reduce((acc, b) => {
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [eh, em] = b.endTime!.split(':').map(Number);
      let mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins < 0) mins += 1440;
      return acc + mins / 60;
    }, 0);
  return { work: sum('WORK'), free: sum('FREE') };
}

export default function TrackingPage() {
  const [work, setWork] = useState<TrackerState>(IDLE);
  const [free, setFree] = useState<TrackerState>(IDLE);
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);
  const [, setTick] = useState(0);
  const { toast } = useToast();

  // Restore any running block from DB on mount
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    entriesApi.getAll(today, today).then(entries => {
      const entry = entries[0] ?? null;
      setTodayEntry(entry);
      if (!entry) return;
      const now = Date.now();
      for (const b of entry.timeBlocks) {
        if (b.endTime !== null) continue;
        const restored: TrackerState = {
          status: 'running',
          blockId: b.id,
          dailyEntryId: entry.id,
          startTime: b.startTime.substring(0, 5),
          startTimestamp: now,
          accumulatedMs: now - parseTimeAsToday(b.startTime),
        };
        if (b.type === 'WORK') setWork(restored);
        else setFree(restored);
      }
    });
  }, []);

  // 1-second tick to re-render timer displays while running
  useEffect(() => {
    if (work.status !== 'running' && free.status !== 'running') return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [work.status, free.status]);

  const ensureTodayEntry = useCallback(async (): Promise<number> => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    if (entries.length > 0) { setTodayEntry(entries[0]); return entries[0].id; }
    const created = await entriesApi.create({
      date: today, mood: 5, sleepingHours: null, health: null, notes: null,
    });
    setTodayEntry(created);
    return created.id;
  }, []);

  const refreshToday = useCallback(async () => {
    const today = dayjs().format('YYYY-MM-DD');
    const entries = await entriesApi.getAll(today, today);
    setTodayEntry(entries[0] ?? null);
  }, []);

  const handleStart = useCallback(async (type: 'WORK' | 'FREE') => {
    try {
      const dailyEntryId = await ensureTodayEntry();
      const now = dayjs();
      const startTimeHHMM = now.format('HH:mm');
      const block = await timeBlocksApi.create({
        dailyEntryId, type, startTime: now.format('HH:mm:ss'),
      });
      const state: TrackerState = {
        status: 'running',
        blockId: block.id,
        dailyEntryId,
        startTime: startTimeHHMM,
        startTimestamp: Date.now(),
        accumulatedMs: 0,
      };
      if (type === 'WORK') setWork(state);
      else setFree(state);
    } catch {
      toast.error('Failed to start tracker');
    }
  }, [ensureTodayEntry, toast]);

  const handlePause = useCallback((type: 'WORK' | 'FREE') => {
    const setter = type === 'WORK' ? setWork : setFree;
    setter(prev => {
      if (prev.status === 'running') {
        return {
          ...prev,
          status: 'paused',
          accumulatedMs: prev.accumulatedMs + (prev.startTimestamp != null ? Date.now() - prev.startTimestamp : 0),
          startTimestamp: null,
        };
      }
      if (prev.status === 'paused') {
        return { ...prev, status: 'running', startTimestamp: Date.now() };
      }
      return prev;
    });
  }, []);

  const handleStop = useCallback(async (type: 'WORK' | 'FREE') => {
    const tracker = type === 'WORK' ? work : free;
    if (!tracker.blockId || !tracker.dailyEntryId || !tracker.startTime) return;
    try {
      await timeBlocksApi.update(tracker.blockId, {
        dailyEntryId: tracker.dailyEntryId,
        type,
        startTime: tracker.startTime + ':00',
        endTime: dayjs().format('HH:mm:ss'),
      });
      if (type === 'WORK') setWork(IDLE);
      else setFree(IDLE);
      await refreshToday();
    } catch {
      toast.error('Failed to stop tracker');
    }
  }, [work, free, refreshToday, toast]);

  const summary = calcTodaySummary(todayEntry);

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <TrackerCard
          type="WORK"
          tracker={work}
          otherStatus={free.status}
          onStart={() => handleStart('WORK')}
          onPause={() => handlePause('WORK')}
          onStop={() => handleStop('WORK')}
        />
        <TrackerCard
          type="FREE"
          tracker={free}
          otherStatus={work.status}
          onStart={() => handleStart('FREE')}
          onPause={() => handlePause('FREE')}
          onStop={() => handleStop('FREE')}
        />
      </Box>

      <Paper elevation={1} sx={{ p: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">Total Work today</Typography>
          <Typography variant="h6" color="primary">{formatHM(summary.work)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" display="block">Total Free Time today</Typography>
          <Typography variant="h6" color="text.secondary">{formatHM(summary.free)}</Typography>
        </Box>
      </Paper>
    </Box>
  );
}

interface TrackerCardProps {
  type: 'WORK' | 'FREE';
  tracker: TrackerState;
  otherStatus: TrackerState['status'];
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

function TrackerCard({ type, tracker, otherStatus, onStart, onPause, onStop }: TrackerCardProps) {
  const label = type === 'WORK' ? 'Work Time' : 'Free Time';
  const elapsed = elapsedMs(tracker);

  const startDisabled  = tracker.status !== 'idle' || otherStatus === 'running';
  const pauseDisabled  = tracker.status === 'idle' || (tracker.status === 'paused' && otherStatus === 'running');
  const stopDisabled   = tracker.status === 'idle';

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {type === 'WORK' ? <WorkIcon color="primary" /> : <SpaIcon color="action" />}
        <Typography variant="h6" fontWeight={700}>{label}</Typography>
        <Box sx={{ ml: 'auto' }}>
          {tracker.status === 'running' && <Chip label="Running" size="small" color="success" />}
          {tracker.status === 'paused'  && <Chip label="Paused"  size="small" color="warning" />}
          {tracker.status === 'idle'    && <Chip label="Idle"    size="small" variant="outlined" />}
        </Box>
      </Box>

      <Typography
        variant="h2"
        sx={{
          textAlign: 'center', fontFamily: 'monospace', my: 3,
          fontSize: { xs: '3rem', sm: '4rem' },
          color: tracker.status === 'idle' ? 'text.disabled' : 'text.primary',
        }}
      >
        {formatElapsed(elapsed)}
      </Typography>

      <Stack direction="row" spacing={2} justifyContent="center">
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="contained" disabled={startDisabled} onClick={onStart}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <PlayArrowIcon />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Start</Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" disabled={pauseDisabled} onClick={onPause}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <PauseIcon />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            {tracker.status === 'paused' ? 'Resume' : 'Pause'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Button variant="outlined" color="error" disabled={stopDisabled} onClick={onStop}
            sx={{ minWidth: 56, height: 56, borderRadius: 2 }}>
            <StopIcon />
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>Stop</Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/TrackingPage.tsx
git commit -m "feat: add TrackingPage with live work/free timers"
git push
```

---

## Task 4: Frontend — Wire up Tracking tab

Work in: `C:\Users\aottmann\interns\work-life-balance-frontend`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add Tracking tab to App.tsx**

Replace `src/App.tsx` entirely:

```tsx
import { useState } from 'react';
import {
  AppBar, Box, Container, Tab, Tabs, Toolbar, Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import DashboardPage from './pages/DashboardPage';
import SummaryPage from './pages/SummaryPage';
import TrackingPage from './pages/TrackingPage';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginDialog from './components/LoginDialog';
import AccountMenu from './components/AccountMenu';

function AppShell() {
  const { token } = useAuth();
  const [tab, setTab] = useState(0);

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flex: 1 }} />
          <Typography variant="h6">Work-Life Balance</Typography>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <AccountMenu />
          </Box>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="inherit"
          indicatorColor="primary"
          centered
          sx={{ bgcolor: 'primary.dark' }}
        >
          <Tab label="Daily Log" />
          <Tab label="Summary" />
          <Tab label="Tracking" />
        </Tabs>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Box hidden={tab !== 0}><DashboardPage /></Box>
        <Box hidden={tab !== 1}><SummaryPage isActive={tab === 1} /></Box>
        <Box hidden={tab !== 2}><TrackingPage /></Box>
      </Container>

      <LoginDialog open={!token} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AppShell />
        </LocalizationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and manually test**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify in order:

1. Three tabs visible: Daily Log | Summary | Tracking
2. Tracking tab shows Work Time and Free Time cards, both showing `00:00:00` / Idle; Start enabled, Pause and Stop disabled on both
3. Click **Start** on Work → timer counts up, chip shows "Running", Pause/Stop enabled; **Free Start is disabled**
4. Click **Pause** on Work → timer freezes, chip shows "Paused"; **Free Start becomes enabled**
5. Click **Start** on Free → Free timer runs; Work chip still "Paused", Work **Resume is disabled**
6. Click **Stop** on Free → block saved, Free resets to Idle, today summary updates; Work Resume now enabled
7. Click **Pause** on Work (Resume) → Work timer continues counting from where it paused
8. Click **Stop** on Work → block saved, Work resets, both summary totals show correct hours
9. Switch to **Daily Log** → open edit for today's entry → Work and Free blocks appear in TimeBlockList with correct start/end times
10. Repeat step 3 but don't stop — refresh the browser → Tracking page restores the running timer from DB with correct elapsed time

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Tracking tab to navigation"
git push
```
