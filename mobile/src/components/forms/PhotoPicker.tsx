import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface PhotoPickerProps {
  photos: { uri: string; width: number; height: number }[];
  onAdd: (photo: { uri: string; width: number; height: number; mimeType: string; fileSize: number }) => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
}

export function PhotoPicker({
  photos,
  onAdd,
  onRemove,
  maxPhotos = 5,
}: PhotoPickerProps) {
  const handlePick = async (source: 'camera' | 'library') => {
    const launchFn =
      source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: ['images'],
      quality: 0.82,
      allowsMultipleSelection: source === 'library',
      selectionLimit: maxPhotos - photos.length,
    });

    if (result.canceled) return;

    for (const asset of result.assets) {
      // Compress: max 1920px on longest side, 82% JPEG quality
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width, 1920) } }],
        { compress: 0.82, format: ImageManipulator.SaveFormat.JPEG },
      );

      onAdd({
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        mimeType: 'image/jpeg',
        fileSize: asset.fileSize || 0,
      });
    }
  };

  const showPicker = () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit reached', `Maximum ${maxPhotos} photos per note.`);
      return;
    }

    Alert.alert('Add Photo', undefined, [
      { text: 'Camera', onPress: () => handlePick('camera') },
      { text: 'Photo Library', onPress: () => handlePick('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photos ({photos.length}/{maxPhotos})</Text>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(index)}
              accessibilityLabel={`Remove photo ${index + 1}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showPicker}
            accessibilityLabel="Add photo"
          >
            <MaterialIcons name="add-a-photo" size={24} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
  },
});
