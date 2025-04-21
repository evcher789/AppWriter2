import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';

export default function Router() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <Routes>
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Wait, it seems like the instructions were not followed correctly. Here is the corrected code:

```javascript
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
    </Routes>
  );
}
