# BarcodeHandler

Globally Handles paste events for barcodes and gives subscribed functions an object with the barcode and what type it conforms to

[![NPM](https://img.shields.io/npm/v/@starrsoftware/barcodehandler.svg)](https://www.npmjs.com/package/@starrsoftware/barcodehandler) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @starrsoftware/barcodehandler
```

## Example Usage

```jsx
import React, { useState } from 'react';
import BarcodeHandler, { AddListener } from '@starrsoftware/barcodehandler';

export default function BarcodeHandlerExample(props) {
   const [barcode, setBarcode] = useState({});

   useEffect(() => {
      AddListener('HomePage', onScan);
   });

   const onScan = (value, type, typeName) => {
      //Do some stuff with your barcode
      console.log(`${typeName}:${value}`);

      setBarcode({ value, type, typeName });
   };

   return (
      <React.Fragment>
         <BarcodeHandler />
         <div>Barcode Type: {barcode.typeName}</div>
         <div>Barcode Value: {barcode.name}</div>
      </React.Fragment>
   );
}
```
