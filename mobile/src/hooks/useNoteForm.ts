import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, photosApi } from '../api/endpoints';
import { NoteType, Visibility } from '../types';
import { useUIStore } from '../store/ui.store';
import { useToast } from '../components/common/Toast';

interface PhotoAsset {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
}

interface NoteFormData {
  type: NoteType;
  title: string;
  binderId: string;
  rating: number;
  freeText: string;
  visibility: Visibility;
  tagIds: string[];
  extension: Record<string, any>;
  venueId: string | null;
  experiencedAt: string;
}

const DRAFT_KEY_PREFIX = 'note_draft_';

export function useNoteForm(type: NoteType, onSuccess: () => void) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const defaultVisibility = useUIStore((s) => s.defaultVisibility);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState<NoteFormData>({
    type,
    title: '',
    binderId: '',
    rating: 0,
    freeText: '',
    visibility: defaultVisibility,
    tagIds: [],
    extension: {},
    venueId: null,
    experiencedAt: new Date().toISOString(),
  });

  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const pendingVenue = useUIStore((s) => s.pendingVenue);
  const draftKey = `${DRAFT_KEY_PREFIX}${type}`;

  // Pre-fill venue from map selection (takes priority over draft)
  useEffect(() => {
    if (pendingVenue) {
      setFormData((prev) => ({
        ...prev,
        venueId: pendingVenue.placeId,
        extension: { ...prev.extension, venueName: pendingVenue.name },
      }));
      return; // skip draft restoration when venue is pre-selected
    }

    // Load draft on mount (only when no pending venue)
    AsyncStorage.getItem(draftKey).then((draft) => {
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed.formData);
        } catch {
          // Ignore invalid draft
        }
      }
    });
  }, [draftKey, pendingVenue]);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isDirty) return;

    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      AsyncStorage.setItem(draftKey, JSON.stringify({ formData }));
    }, 30000);

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [formData, isDirty, draftKey]);

  const updateField = useCallback(
    <K extends keyof NoteFormData>(key: K, value: NoteFormData[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [],
  );

  const updateExtension = useCallback(
    (key: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        extension: { ...prev.extension, [key]: value },
      }));
      setIsDirty(true);
    },
    [],
  );

  const addPhoto = useCallback((photo: PhotoAsset) => {
    setPhotos((prev) => [...prev, photo]);
    setIsDirty(true);
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      // Upload photos first
      const photoIds: string[] = [];
      for (const photo of photos) {
        const { uploadUrl, photo: photoRecord } = await photosApi.presign(
          photo.mimeType,
          photo.fileSize,
        );
        await photosApi.upload(uploadUrl, photo.uri, photo.mimeType);
        photoIds.push(photoRecord.id);
      }

      // Create note
      return notesApi.create({
        ...formData,
        photoIds,
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      AsyncStorage.removeItem(draftKey);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['binders'] });
      showToast('Note saved!', 'success');
      onSuccess();
    },
    onError: (error: any) => {
      showToast(
        error?.response?.data?.message || 'Failed to save note',
        'error',
      );
    },
  });

  const confirmDiscard = useCallback(
    (goBack: () => void) => {
      if (!isDirty) {
        goBack();
        return;
      }
      Alert.alert('Discard note?', 'Your unsaved changes will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            AsyncStorage.removeItem(draftKey);
            goBack();
          },
        },
      ]);
    },
    [isDirty, draftKey],
  );

  return {
    formData,
    photos,
    updateField,
    updateExtension,
    addPhoto,
    removePhoto,
    submit: mutation.mutate,
    isSubmitting: mutation.isPending,
    confirmDiscard,
  };
}
