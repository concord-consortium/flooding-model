import * as React from "react";
import MuiDialog from "@material-ui/core/Dialog";
import CloseIcon from "@material-ui/icons/Close";
import css from "./dialog.scss";

interface IProps {
  onClose: () => void;
  open: boolean;
  title?: string;
  children?: JSX.Element;
}

export const Dialog: React.FC<IProps> = ({ onClose, open, title, children }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  return (
    <MuiDialog
      onClose={onClose}
      open={open}
      maxWidth="lg"
      PaperProps={{ "aria-label": title, "aria-modal": true }}
      TransitionProps={{ onEntering: () => closeRef.current?.focus() }}
    >
      <div className={css.dialogBody}>
        { title && <h2 className={css.title}>{ title }</h2> }
        <button ref={closeRef} type="button" aria-label="Close" className={css.closeButton} onClick={onClose}>
          <CloseIcon />
        </button>
        <div className={css.content}>{ children }</div>
      </div>
    </MuiDialog>
  );
};
