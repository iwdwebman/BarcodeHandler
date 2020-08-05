import { useState, useEffect } from 'react';

export const BARCODE_TYPES = {
   UNKNOWN: 0,
   EAN: 1,
   UPC: 2,
   AMAZON_FNSKU: 3
};

export const BARCODE_NAMES = {
   [BARCODE_TYPES.UNKNOWN]: 'Unknown',
   [BARCODE_TYPES.EAN]: 'EAN',
   [BARCODE_TYPES.UPC]: 'UPC',
   [BARCODE_TYPES.AMAZON_FNSKU]: 'FNSKU'
};

export const BARCODE_REGEXES = {
   [BARCODE_TYPES.EAN]: /\b\d{13}\b/,
   [BARCODE_TYPES.UPC]: /\b\d{12}\b/,
   [BARCODE_TYPES.AMAZON_FNSKU]: /\bcX[0-9A-Z]{9}\b/
};

export const DEFAULT_ENDING_KEYS = {
   ENTER: 'Enter',
   TAB: 'Tab'
};

const DEFAULT_KEY_TIMING = 100;

let globalText = '';
let globalDate = new Date();

let listeners = {};
let customTypes = {};
let CurrentEndingKeys = [DEFAULT_ENDING_KEYS.ENTER, DEFAULT_ENDING_KEYS.TAB];
let keyTiming = DEFAULT_KEY_TIMING;
let allowPaste = false;

//Be sure to set more restrictive first as some barcode types overlap when it comes to the data they return. i.e. EAN before UPC
export const SetCustomType = (key, name, regex) => {
   if (
      (key || '').length <= 0 ||
      (name || '').length <= 0 ||
      !regex ||
      typeof regex.test !== 'function'
   ) {
      return false;
   }

   customTypes[key] = { name, regex };
};

export const SetEndingKeys = (keys) => {
   CurrentEndingKeys = keys;
};

export const SetKeyTiming = (timing) => {
   if (timing > 0 && timing < 1000) {
      keyTiming = timing;
   }
};

export const SetAllowPaste = (allow) => {
   allowPaste = !!allow;
};

export const AddListener = (name, listener) => {
   listeners[name] = listener;
};

export const RemoveListener = (name) => {
   if (Object.keys(listeners).includes(name)) {
      delete listeners[name];
      return true;
   }

   return false;
};

export default function BarcodeHandler(props) {
   const [isListening, setIsListening] = useState(false);

   const defaultScanLog = (value, type, typeName) => {
      console.info(`${typeName}:${value}`);
   };

   const { onScan = defaultScanLog } = props;

   useEffect(() => {
      if (!isListening) {
         const handleBarcode = async (value) => {
            let type = BARCODE_TYPES.UNKNOWN;
            let name = BARCODE_NAMES.UNKNOWN;

            var customMatchKey = Object.keys(customTypes).find(
               (customTypeKey) => {
                  return customTypes[customTypeKey].regex.test(value);
               }
            );

            if (customMatchKey) {
               type = customMatchKey;
               name = customTypes[customMatchKey].name;
            } else {
               let regexMatchKey = Object.keys(BARCODE_REGEXES).find(
                  (barcodeKey) => {
                     if (barcodeKey === BARCODE_REGEXES.UNKNOWN) {
                        return false;
                     }

                     return BARCODE_REGEXES[barcodeKey].test(value);
                  }
               );

               if (regexMatchKey) {
                  type = regexMatchKey;
                  name = BARCODE_NAMES[type];
               }
            }

            onScan(value, type, name);

            Object.values(listeners).forEach((listener) => {
               listener(value, type, name);
            });
         };

         document.addEventListener('paste', (e) => {
            if (allowPaste) {
               handleBarcode(e.clipboardData.getData('Text'));
            }
         });
         document.addEventListener('keydown', (e) => {
            const isWithinTimeLimit = new Date() - globalDate < keyTiming;
            globalDate = new Date();

            if (e.key === 'Shift') {
               return;
            } else if (CurrentEndingKeys.includes(e.code)) {
               if (isWithinTimeLimit) {
                  handleBarcode(globalText);
               }

               globalText = '';
               return;
            }

            globalText = isWithinTimeLimit ? `${globalText}${e.key}` : e.key;
         });

         setIsListening(true);
      }
   }, [isListening, onScan]);

   return null;
}
