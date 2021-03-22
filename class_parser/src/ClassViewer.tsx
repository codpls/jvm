import React, { useEffect, useState } from 'react';
import { ClassParser } from './ClassParser';

export const ClassViewer = ({data}: {data: Uint8Array}) => {

  const [classModel, setClassModel] = useState<ClassParser>();
  useEffect(() => {
    const parser = new ClassParser(data);
    parser.process().then(result => {
      setClassModel(result)
      console.log(result);
    });
  }, [data]);

  const str = String.fromCharCode(...Array.from(data));

  return (
    <div>
      {!classModel && <p>processing...</p>}
      {
        classModel && (
          <>
            <p>magic: {classModel.magic}</p>
            <p>minor version: {classModel.minorVersion}</p>
            <p>major version: {classModel.majorVersion}</p>
            <p>constants: {classModel.constantCount}</p>
          </>
        )
      }
    </div>
  );
};
