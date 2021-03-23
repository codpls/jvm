
import styles from './HexViewer.module.css';

const numToHex = (num: number) => num.toString(16).toUpperCase();


export const HexViewer = ({
  data,
}: {
  data: Uint8Array,
}) => {

  return (
    <table>
      <tr>
        <th></th>
        {
          new Array(16).fill(0).map((_, i) => (
            <th className={styles.title}>{numToHex(i)}</th>
          ))
        }
      </tr>
      {
        new Array(Math.ceil(data.length / 16)).fill(0).map((_, i) => (
          <tr>
            <th className={styles.caption}>{numToHex(i).padStart(4, '0')}</th>
            {
              Array.from(data.slice(i * 16, i * 16 + 16)).map(hex => (
                <td className={styles.val}>{numToHex(hex).padStart(2, '0')}</td>
              ))
            }
          </tr>
        ))
      }
    </table>
  );
};
