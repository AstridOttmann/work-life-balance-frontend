# Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native mobile app for iPhone that replicates the full web app (daily log, appointments, summary) using Expo and React Native Paper, tested with Expo Go.

**Architecture:** New Expo Router project at `work-life-balance-mobile/`. Two tabs: Daily Log and Summary. API layer is a direct copy of the web app's service module pointed at the Railway URL. ToastContext adapted from the web app using React Native Paper's Snackbar.

**Tech Stack:** Expo SDK (latest), Expo Router, React Native, TypeScript, React Native Paper, Axios, dayjs, @react-native-community/datetimepicker

**Prerequisite:** Railway deployment plan completed — Railway URL is known.

---

## Files

| Action | Path |
|---|---|
| Create | `app/_layout.tsx` |
| Create | `app/(tabs)/_layout.tsx` |
| Create | `app/(tabs)/index.tsx` |
| Create | `app/(tabs)/summary.tsx` |
| Create | `components/EntryCard.tsx` |
| Create | `components/EntryForm.tsx` |
| Create | `components/AppointmentList.tsx` |
| Create | `components/AppointmentForm.tsx` |
| Create | `services/api.ts` |
| Create | `types/entry.ts` |
| Create | `context/ToastContext.tsx` |
| Modify | `app.json` |
| Create | `.env` |

---

### Task 1: Initialize Expo project

**Files:**
- Creates: entire project scaffold

- [ ] **Step 1: Create the project**

Run from `C:\Users\aottmann\interns\`:

```bash
npx create-expo-app@latest work-life-balance-mobile
```

Select the default template when prompted (Expo Router tabs template). This creates the directory `work-life-balance-mobile/` with Expo Router already configured.

- [ ] **Step 2: Install additional dependencies**

```bash
cd work-life-balance-mobile
npx expo install react-native-paper react-native-safe-area-context react-native-screens @expo/vector-icons @react-native-community/datetimepicker
npm install axios dayjs
```

- [ ] **Step 3: Delete boilerplate files we don't need**

```bash
rm -rf components/
rm -rf constants/
rm -rf hooks/
rm app/\(tabs\)/explore.tsx
```

Also delete `app/+not-found.tsx` if it exists — we don't need it for a personal app.

- [ ] **Step 4: Verify Expo starts**

```bash
npx expo start
```

Expected: QR code appears in terminal. Press `Ctrl+C` to stop.

---

### Task 2: Configure app.json and environment

**Files:**
- Modify: `app.json`
- Create: `.env`
- Create: `.gitignore` addition

- [ ] **Step 1: Update app.json**

Replace the contents of `app.json` with:

```json
{
  "expo": {
    "name": "Work-Life Balance",
    "slug": "work-life-balance-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "wlb",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": false
    },
    "plugins": [
      "expo-router",
      "@react-native-community/datetimepicker"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 2: Create .env with the Railway URL**

Create a `.env` file in the project root:

```
EXPO_PUBLIC_API_URL=https://<your-railway-url>/api
```

Replace `<your-railway-url>` with the actual Railway URL from the deployment plan.

For local WiFi development (testing at home before Railway is deployed), use:
```
EXPO_PUBLIC_API_URL=http://192.168.x.x:8080/api
```
Replace `192.168.x.x` with your computer's local IP address (`ipconfig` on Windows to find it).

- [ ] **Step 3: Ensure .env is in .gitignore**

Open `.gitignore` and verify `.env` is listed. If not, add it:

```
.env
```

---

### Task 3: Types and API service

These are direct copies from the web app.

**Files:**
- Create: `types/entry.ts`
- Create: `services/api.ts`

- [ ] **Step 1: Create types/entry.ts**

```ts
export interface DailyEntry {
  id: number;
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
  appointments: Appointment[];
}

export interface DailyEntryInput {
  date: string;
  workHours: number | null;
  freeTimeHours: number | null;
  sleepingHours: number | null;
  mood: number;
  notes: string | null;
}

export interface Appointment {
  id: number;
  dailyEntryId: number;
  title: string;
  time: string | null;
  durationHours: number | null;
}

export interface AppointmentInput {
  dailyEntryId: number;
  title: string;
  time: string | null;
  durationHours: number | null;
}

export interface Summary {
  period: string;
  startDate: string;
  endDate: string;
  avgWorkHours: number | null;
  avgFreeTimeHours: number | null;
  avgSleepingHours: number | null;
  avgMood: number | null;
  entryCount: number;
}
```

- [ ] **Step 2: Create services/api.ts**

```ts
import axios from 'axios';
import type { Appointment, AppointmentInput, DailyEntry, DailyEntryInput, Summary } from '../types/entry';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api',
});

export const entriesApi = {
  getAll: (from?: string, to?: string) =>
    api.get<DailyEntry[]>('/entries', { params: { from, to } }).then(r => r.data),

  getById: (id: number) =>
    api.get<DailyEntry>(`/entries/${id}`).then(r => r.data),

  create: (data: DailyEntryInput) =>
    api.post<DailyEntry>('/entries', data).then(r => r.data),

  update: (id: number, data: DailyEntryInput) =>
    api.put<DailyEntry>(`/entries/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/entries/${id}`),

  getSummary: (period: 'weekly' | 'monthly', date: string) =>
    api.get<Summary>('/entries/summary', { params: { period, date } }).then(r => r.data),
};

export const appointmentsApi = {
  create: (data: AppointmentInput) =>
    api.post<Appointment>('/appointments', data).then(r => r.data),

  update: (id: number, data: AppointmentInput) =>
    api.put<Appointment>(`/appointments/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/appointments/${id}`),
};
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add types/entry.ts services/api.ts
git commit -m "feat: add types and API service"
```

---

### Task 4: ToastContext

**Files:**
- Create: `context/ToastContext.tsx`

- [ ] **Step 1: Create context/ToastContext.tsx**

```tsx
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Snackbar } from 'react-native-paper';
import type { AxiosError } from 'axios';
import { api } from '../services/api';

type Severity = 'success' | 'error';

interface ToastState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ToastState>({ open: false, message: '', severity: 'success' });

  const show = useCallback((message: string, severity: Severity) => {
    setState({ open: true, message, severity });
  }, []);

  const toast = {
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error'),
  };

  const handleDismiss = () => setState(prev => ({ ...prev, open: false }));

  useEffect(() => {
    const id = api.interceptors.response.use(
      response => response,
      (error: AxiosError<{ message?: string }>) => {
        const serverMessage = error.response?.data?.message;
        const statusMessage =
          error.response?.status === 400 ? 'Bad request' :
          error.response?.status === 404 ? 'Not found' :
          error.response?.status === 409 ? 'Conflict' :
          error.response?.status != null && error.response.status >= 500 ? 'Server error' : null;
        show(serverMessage ?? statusMessage ?? 'Something went wrong', 'error');
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(id);
  }, [show]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Snackbar
        visible={state.open}
        onDismiss={handleDismiss}
        duration={4000}
        style={{ backgroundColor: state.severity === 'error' ? '#B00020' : '#388E3C' }}
      >
        {state.message}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add context/ToastContext.tsx
git commit -m "feat: add ToastContext with Axios error interceptor"
```

---

### Task 5: AppointmentForm component

**Files:**
- Create: `components/AppointmentForm.tsx`

- [ ] **Step 1: Create components/AppointmentForm.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import type { Appointment, AppointmentInput } from '../types/entry';

interface Props {
  dailyEntryId: number;
  initial?: Appointment;
  onSave: (data: AppointmentInput) => Promise<void>;
  onCancel: () => void;
}

export default function AppointmentForm({ dailyEntryId, initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [time, setTime] = useState(initial?.time?.substring(0, 5) ?? '');
  const [durationHours, setDurationHours] = useState(
    initial?.durationHours != null ? String(initial.durationHours) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        dailyEntryId,
        title: title.trim(),
        time: time || null,
        durationHours: durationHours ? parseFloat(durationHours) : null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        label="Time (HH:mm)"
        value={time}
        onChangeText={setTime}
        placeholder="e.g. 09:30"
        style={styles.input}
      />
      <TextInput
        label="Duration (hours)"
        value={durationHours}
        onChangeText={setDurationHours}
        keyboardType="numeric"
        style={styles.input}
      />
      <View style={styles.buttons}>
        <Button onPress={onCancel} disabled={saving}>Cancel</Button>
        <Button mode="contained" onPress={handleSubmit} disabled={saving || !title.trim()}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  input: { backgroundColor: 'transparent' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AppointmentForm.tsx
git commit -m "feat: add AppointmentForm component"
```

---

### Task 6: AppointmentList component

**Files:**
- Create: `components/AppointmentList.tsx`

- [ ] **Step 1: Create components/AppointmentList.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, Divider, IconButton, List, Portal, Text } from 'react-native-paper';
import type { Appointment, AppointmentInput } from '../types/entry';
import AppointmentForm from './AppointmentForm';
import { appointmentsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  dailyEntryId: number;
  appointments: Appointment[];
  onChange: () => void;
}

export default function AppointmentList({ dailyEntryId, appointments, onChange }: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const handleCreate = async (data: AppointmentInput) => {
    await appointmentsApi.create(data);
    setAddOpen(false);
    toast.success('Appointment created');
    onChange();
  };

  const handleUpdate = async (data: AppointmentInput) => {
    if (!editTarget) return;
    await appointmentsApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Appointment updated');
    onChange();
  };

  const handleDelete = async (id: number) => {
    await appointmentsApi.delete(id);
    toast.success('Appointment deleted');
    onChange();
  };

  return (
    <View>
      <Button icon="plus" onPress={() => setAddOpen(true)} compact style={styles.addBtn}>
        Add appointment
      </Button>

      {appointments.length === 0 ? (
        <Text variant="bodySmall" style={styles.empty}>No appointments</Text>
      ) : (
        appointments.map((a, i) => (
          <View key={a.id}>
            {i > 0 && <Divider />}
            <List.Item
              title={a.title}
              description={() => (
                <View style={styles.chips}>
                  {a.time && <Chip compact>{a.time.substring(0, 5)}</Chip>}
                  {a.durationHours != null && <Chip compact>{a.durationHours}h</Chip>}
                </View>
              )}
              right={() => (
                <View style={styles.actions}>
                  <IconButton icon="pencil" size={16} onPress={() => setEditTarget(a)} />
                  <IconButton icon="delete" size={16} onPress={() => handleDelete(a.id)} />
                </View>
              )}
            />
          </View>
        ))
      )}

      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>New Appointment</Dialog.Title>
          <Dialog.Content>
            <AppointmentForm
              dailyEntryId={dailyEntryId}
              onSave={handleCreate}
              onCancel={() => setAddOpen(false)}
            />
          </Dialog.Content>
        </Dialog>

        <Dialog visible={!!editTarget} onDismiss={() => setEditTarget(null)}>
          <Dialog.Title>Edit Appointment</Dialog.Title>
          <Dialog.Content>
            {editTarget && (
              <AppointmentForm
                dailyEntryId={dailyEntryId}
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  addBtn: { alignSelf: 'flex-end' },
  empty: { opacity: 0.6, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 4, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AppointmentList.tsx
git commit -m "feat: add AppointmentList component"
```

---

### Task 7: EntryForm component

**Files:**
- Create: `components/EntryForm.tsx`

- [ ] **Step 1: Create components/EntryForm.tsx**

```tsx
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DailyEntry, DailyEntryInput } from '../types/entry';

interface Props {
  initial?: DailyEntry;
  onSave: (data: DailyEntryInput) => Promise<void>;
  onCancel: () => void;
}

export default function EntryForm({ initial, onSave, onCancel }: Props) {
  const [date, setDate] = useState<Date>(
    initial ? new Date(initial.date) : new Date()
  );
  const [workHours, setWorkHours] = useState(
    initial?.workHours != null ? String(initial.workHours) : ''
  );
  const [freeTimeHours, setFreeTimeHours] = useState(
    initial?.freeTimeHours != null ? String(initial.freeTimeHours) : ''
  );
  const [sleepingHours, setSleepingHours] = useState(
    initial?.sleepingHours != null ? String(initial.sleepingHours) : ''
  );
  const [mood, setMood] = useState(String(initial?.mood ?? 5));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      await onSave({
        date: `${yyyy}-${mm}-${dd}`,
        workHours: workHours ? parseFloat(workHours) : null,
        freeTimeHours: freeTimeHours ? parseFloat(freeTimeHours) : null,
        sleepingHours: sleepingHours ? parseFloat(sleepingHours) : null,
        mood: Math.min(10, Math.max(1, parseInt(mood) || 5)),
        notes: notes.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {!initial && (
        <>
          <Text variant="labelMedium" style={styles.label}>Date</Text>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={(_, d) => { if (d) setDate(d); }}
          />
        </>
      )}
      <TextInput label="Work hours" keyboardType="numeric" value={workHours} onChangeText={setWorkHours} style={styles.input} />
      <TextInput label="Free time hours" keyboardType="numeric" value={freeTimeHours} onChangeText={setFreeTimeHours} style={styles.input} />
      <TextInput label="Sleeping hours" keyboardType="numeric" value={sleepingHours} onChangeText={setSleepingHours} style={styles.input} />
      <TextInput label="Mood (1–10)" keyboardType="numeric" value={mood} onChangeText={setMood} style={styles.input} />
      <TextInput label="Notes" multiline numberOfLines={3} value={notes} onChangeText={setNotes} style={styles.input} />
      <View style={styles.buttons}>
        <Button onPress={onCancel} disabled={saving}>Cancel</Button>
        <Button mode="contained" onPress={handleSubmit} disabled={saving}>
          {initial ? 'Update' : 'Save'}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 8 },
  label: { opacity: 0.7 },
  input: { backgroundColor: 'transparent' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/EntryForm.tsx
git commit -m "feat: add EntryForm component"
```

---

### Task 8: EntryCard component

**Files:**
- Create: `components/EntryCard.tsx`

- [ ] **Step 1: Create components/EntryCard.tsx**

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, IconButton, Text } from 'react-native-paper';
import type { DailyEntry } from '../types/entry';
import AppointmentList from './AppointmentList';

interface Props {
  entry: DailyEntry;
  onEdit: (entry: DailyEntry) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function EntryCard({ entry, onEdit, onDelete, onRefresh }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.date}>{entry.date}</Text>
          <View style={styles.actions}>
            <IconButton icon="pencil" size={18} onPress={() => onEdit(entry)} />
            <IconButton icon="delete" size={18} onPress={() => onDelete(entry.id)} />
          </View>
        </View>

        <View style={styles.chips}>
          {entry.workHours != null && (
            <Chip compact icon="briefcase">{entry.workHours}h work</Chip>
          )}
          {entry.freeTimeHours != null && (
            <Chip compact icon="heart">{entry.freeTimeHours}h free</Chip>
          )}
          {entry.sleepingHours != null && (
            <Chip compact icon="sleep">{entry.sleepingHours}h sleep</Chip>
          )}
          <Chip compact icon="emoticon">Mood {entry.mood}/10</Chip>
        </View>

        {entry.notes && (
          <Text variant="bodySmall" style={styles.notes}>{entry.notes}</Text>
        )}

        <IconButton
          icon={expanded ? 'chevron-up' : 'chevron-down'}
          onPress={() => setExpanded(v => !v)}
          size={20}
          style={styles.toggle}
        />

        {expanded && (
          <AppointmentList
            dailyEntryId={entry.id}
            appointments={entry.appointments}
            onChange={onRefresh}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontWeight: '700' },
  actions: { flexDirection: 'row' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  notes: { opacity: 0.7, marginBottom: 4 },
  toggle: { alignSelf: 'center' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/EntryCard.tsx
git commit -m "feat: add EntryCard component"
```

---

### Task 9: Navigation layout

**Files:**
- Modify: `app/_layout.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Update app/_layout.tsx**

Replace the contents of `app/_layout.tsx` with:

```tsx
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../context/ToastContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </PaperProvider>
  );
}
```

- [ ] **Step 2: Create app/(tabs)/_layout.tsx**

```tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily Log',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx app/\(tabs\)/_layout.tsx
git commit -m "feat: set up navigation layout with PaperProvider and ToastProvider"
```

---

### Task 10: Daily Log screen

**Files:**
- Create: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create app/(tabs)/index.tsx**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Dialog, FAB, Portal, Text } from 'react-native-paper';
import type { DailyEntry, DailyEntryInput } from '../../types/entry';
import { entriesApi } from '../../services/api';
import EntryCard from '../../components/EntryCard';
import EntryForm from '../../components/EntryForm';
import { useToast } from '../../context/ToastContext';

export default function DailyLogScreen() {
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DailyEntry | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    try {
      const data = await entriesApi.getAll();
      setEntries([...data].sort((a, b) => b.date.localeCompare(a.date)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: DailyEntryInput) => {
    await entriesApi.create(data);
    setAddOpen(false);
    toast.success('Entry created');
    await load();
  };

  const handleUpdate = async (data: DailyEntryInput) => {
    if (!editTarget) return;
    await entriesApi.update(editTarget.id, data);
    setEditTarget(null);
    toast.success('Entry updated');
    await load();
  };

  const handleDelete = async (id: number) => {
    await entriesApi.delete(id);
    toast.success('Entry deleted');
    await load();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={e => String(e.id)}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onEdit={setEditTarget}
            onDelete={handleDelete}
            onRefresh={load}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No entries yet. Tap + to add your first day!</Text>
        }
      />

      <FAB icon="plus" style={styles.fab} onPress={() => setAddOpen(true)} />

      <Portal>
        <Dialog visible={addOpen} onDismiss={() => setAddOpen(false)}>
          <Dialog.Title>New Day Entry</Dialog.Title>
          <Dialog.ScrollArea>
            <EntryForm onSave={handleCreate} onCancel={() => setAddOpen(false)} />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog visible={!!editTarget} onDismiss={() => setEditTarget(null)}>
          <Dialog.Title>Edit Entry</Dialog.Title>
          <Dialog.ScrollArea>
            {editTarget && (
              <EntryForm
                initial={editTarget}
                onSave={handleUpdate}
                onCancel={() => setEditTarget(null)}
              />
            )}
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: 48 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: add Daily Log screen"
```

---

### Task 11: Summary screen

**Files:**
- Create: `app/(tabs)/summary.tsx`

- [ ] **Step 1: Create app/(tabs)/summary.tsx**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import dayjs from 'dayjs';
import type { Summary } from '../../types/entry';
import { entriesApi } from '../../services/api';

export default function SummaryScreen() {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await entriesApi.getSummary(period, date);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [period, date]);

  useEffect(() => { load(); }, [load]);

  const navigate = (dir: 1 | -1) => {
    setDate(prev =>
      dayjs(prev)
        .add(dir * (period === 'weekly' ? 7 : 1), period === 'weekly' ? 'day' : 'month')
        .format('YYYY-MM-DD')
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.periodRow}>
        <Button
          mode={period === 'weekly' ? 'contained' : 'outlined'}
          onPress={() => setPeriod('weekly')}
          compact
        >
          Weekly
        </Button>
        <Button
          mode={period === 'monthly' ? 'contained' : 'outlined'}
          onPress={() => setPeriod('monthly')}
          compact
        >
          Monthly
        </Button>
      </View>

      <View style={styles.navRow}>
        <Button icon="chevron-left" onPress={() => navigate(-1)} compact>Prev</Button>
        <Text variant="titleSmall">
          {summary ? `${summary.startDate} – ${summary.endDate}` : '...'}
        </Text>
        <Button icon="chevron-right" onPress={() => navigate(1)} compact>Next</Button>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.spinner} />
      ) : summary ? (
        <Card>
          <Card.Content style={styles.stats}>
            <StatRow label="Avg work hours" value={summary.avgWorkHours} />
            <StatRow label="Avg free time" value={summary.avgFreeTimeHours} />
            <StatRow label="Avg sleep" value={summary.avgSleepingHours} />
            <StatRow label="Avg mood" value={summary.avgMood} suffix="/10" />
            <StatRow label="Entries" value={summary.entryCount} suffix="" />
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function StatRow({ label, value, suffix = 'h' }: { label: string; value: number | null; suffix?: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="bodyMedium">{label}</Text>
      <Text variant="bodyMedium" style={styles.statValue}>
        {value != null ? `${value}${suffix}` : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  periodRow: { flexDirection: 'row', gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spinner: { marginTop: 48 },
  stats: { gap: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontWeight: '600' },
});
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/summary.tsx"
git commit -m "feat: add Summary screen"
```

---

### Task 12: Initialize git and push to GitHub

**Files:**
- Modify: `.gitignore` (verify node_modules, .env are excluded)

- [ ] **Step 1: Verify .gitignore**

Open `.gitignore` (created by `create-expo-app`). Confirm it contains at least:

```
node_modules/
.expo/
dist/
.env
```

Add `.env` if missing.

- [ ] **Step 2: Connect to GitHub remote**

```bash
git remote add origin https://github.com/AstridOttmann/work-life-balance-mobile.git
git push -u origin main
```

Expected: push succeeds.

---

### Task 13: Test on iPhone with Expo Go

These are manual verification steps — no code changes.

- [ ] **Step 1: Install Expo Go on iPhone**

On your iPhone, open the App Store, search for **Expo Go**, and install it.

- [ ] **Step 2: Start the dev server**

```bash
cd work-life-balance-mobile
npx expo start
```

A QR code appears in the terminal.

- [ ] **Step 3: Open the app**

On your iPhone, open the Camera app and point it at the QR code. Tap the notification to open in Expo Go.

- [ ] **Step 4: Verify core flows**

- [ ] Daily Log loads (spinner → list or empty state)
- [ ] Tap + → New Day Entry form opens with date picker
- [ ] Create an entry → success toast, entry appears in list
- [ ] Edit entry → prefilled form, update works
- [ ] Delete entry → entry disappears
- [ ] Expand entry → appointment section shows
- [ ] Add appointment → appears in list
- [ ] Summary tab → weekly stats load
- [ ] Switch to monthly → stats update
- [ ] Prev / Next navigation works
