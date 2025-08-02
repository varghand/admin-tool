
  export const getReadableFormat = (shortForm) => {
    switch (shortForm) {
      case "varghand-employee":
        return "Sound Realms Admin";
      case "fod-pre-order":
        return "The Fortress of Death (Pre-Order)"
      case "fod":
        return "The Fortress of Death";
      case "fod-beta":
        return "The Fortress of Death (Beta Access)";
      case "fod-kickstarter":
        return "The Fortress of Death (Kickstarter Backer)";
      case "fist-pre-order":
        return "F.I.S.T. (Pre-Order)"
      case "fist":
        return "F.I.S.T.";
      case "coc_aatt_beta":
        return "Alone Against the Tide (Beta Access)";
      case "bundle-pre-order":
        return "F.I.S.T. + The Fortress of Death Bundle";
      case "fod-expansions":
        return "The Fortress of Death: Expansion Bundle 1";
      default:
        return shortForm;
    }
  };
