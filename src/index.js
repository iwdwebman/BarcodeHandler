import { useState, useEffect } from 'react';

let globalText = '';
let globalDate = new Date();

let listeners = {};
let customTypes = {};

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
   [BARCODE_TYPES.EAN]: /\d{13}/,
   [BARCODE_TYPES.UPC]: /\d{12}/,
   [BARCODE_TYPES.AMAZON_FNSKU]: /X[0-9A-Z]{9}/
};

//Be sure to set more restrictive first as some barcode types overlap when it comes to the data they return. i.e. EAN before UPC
export const SetCustomType = (value, name, regex) => {
   if (
      Object.values(BARCODE_TYPES).includes(value) ||
      value < 0 ||
      (name || '').length <= 0 ||
      !regex ||
      typeof regex.test !== 'function'
   ) {
      return false;
   }

   customTypes[value] = { name, regex };
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

         /*document.addEventListener('paste', (e) => {
            handleBarcode(e.clipboardData.getData('Text'));
         });*/
         document.addEventListener('keydown', (e) => {
            const isWithinTimeLimit = new Date() - globalDate < 200;
            globalDate = new Date();

            if (e.key === 'Shift') {
               return;
            } else if (e.code === 'Enter') {
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
