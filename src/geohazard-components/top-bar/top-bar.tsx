import * as React from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import { Dialog } from "./dialog";
import { log } from "../../log";
import css from "./top-bar.scss";

interface IProps {
  projectName: string;
  aboutContent?: JSX.Element;
  shareContent?: JSX.Element;
  onBeforeReload?: () => void;
}

export const TopBar: React.FC<IProps> = ({ projectName, aboutContent, shareContent, onBeforeReload }: IProps) => {
  const [shareOpen, setShareOpen] = React.useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = React.useState<boolean>(false);

  const handleReload = () => {
    onBeforeReload?.();
    log("TopBarReloadButtonClicked");
    // Give some time for the log message to be delivered. Note it goes only to the parent window using postMessage,
    // so we don't have to wait for network request.
    setTimeout(() => window.location.reload(), 100);
  };
  // macOS Safari and Firefox do not focus a button on click, so focus it here for the dialog to restore focus to on close.
  const handleShareOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    setShareOpen(true);
    log("ShareDialogOpened");
  };
  const handleAboutOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    setAboutOpen(true);
    log("AboutDialogOpened");
  };
  const handleShareClose = () => setShareOpen(false);
  const handleAboutClose = () => setAboutOpen(false);

  return (
    <div className={css.topBar}>
      <button
        type="button"
        data-testid="reload"
        className={css.textButton}
        aria-label="Reload"
        title="Reload"
        onClick={handleReload}
      >
        <RefreshIcon />
      </button>
      <span>
        <button type="button" data-testid="share" className={css.textButton} onClick={handleShareOpen}>
          Share
        </button>
        <button type="button" data-testid="about" className={css.textButton} onClick={handleAboutOpen}>
          About
        </button>
      </span>
      <Dialog
        onClose={handleAboutClose}
        open={aboutOpen}
        title={`About: ${projectName}`}
      >
        { aboutContent }
      </Dialog>
      <Dialog
        onClose={handleShareClose}
        open={shareOpen}
        title={`Share: ${projectName}`}
      >
        { shareContent }
      </Dialog>
    </div>
  );
};
