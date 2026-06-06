import { useState, useEffect } from "react";
import { getTheme, setTheme, Theme } from "@/lib/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  useEffect(() => {
    setThemeState(getTheme());
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  return { theme, setTheme: changeTheme };
}
