import { useEffect, useRef } from 'react';
import { formStorageUtils } from '../utils/formStorageUtils';
import { useNotification } from '../context/NotificationContext';

interface UseFormPersistenceOptions {
  formId: string;
  responses: Record<string, unknown>;
  onResponsesRestore: (responses: Record<string, unknown>) => void;
}

export function useFormPersistence({
  formId,
  responses,
  onResponsesRestore,
}: UseFormPersistenceOptions) {
  const { showInfo } = useNotification();
  const hasShownRecoveryNotif = useRef(false);
  const storageKey = formStorageUtils.getFormDataKey(formId);
  const recoveredFlagKey = formStorageUtils.getRecoveredDataKey(formId);

  useEffect(() => {
    if (!hasShownRecoveryNotif.current) {
      const recoveredData = formStorageUtils.get<Record<string, unknown>>(
        storageKey
      );

      if (recoveredData && Object.keys(recoveredData).length > 0) {
        const wasRecoveryShown = sessionStorage.getItem(recoveredFlagKey);
        if (!wasRecoveryShown) {
          onResponsesRestore(recoveredData);
          showInfo(
            'Your previous form data has been recovered.',
            'Form Data Restored'
          );
          sessionStorage.setItem(recoveredFlagKey, 'true');
          hasShownRecoveryNotif.current = true;
        }
      }
    }
  }, [formId, onResponsesRestore, showInfo, storageKey, recoveredFlagKey]);

  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      formStorageUtils.save(storageKey, responses);
    }
  }, [responses, storageKey]);

  const clearSavedData = () => {
    formStorageUtils.remove(storageKey);
    sessionStorage.removeItem(recoveredFlagKey);
  };

  return { clearSavedData };
}
