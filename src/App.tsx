import React from 'react'
import Classic from './Classic';
import RTK from './RTK';

const App = () => {
  const [bool, setBool] = React.useState(true);
  return bool ? <RTK change={() => setBool(false)} /> : <Classic change={() => setBool(true)} />;
}

export default App
