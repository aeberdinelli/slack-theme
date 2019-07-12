[Setup]
AppName=Slack Dark Theme
AppVersion=1.0
DefaultDirName={autopf}\..\slack
DefaultGroupName=Slack Dark Theme
AppPublisher=Alan Berdinelli
AppPublisherURL=https://github.com/aeberdinelli/slack-theme
CloseApplications=yes
SetupIconFile=icon.ico
WizardSmallImageFile=icon.bmp
PrivilegesRequired=lowest
DirExistsWarning=no
UninstallFilesDir={app}\slack-theme\
OutputDir=..\dist
OutputBaseFilename=slack-theme
WizardStyle=modern
WizardResizable=no
InfoBeforeFile=readme.rtf
Uninstallable=no
DisableReadyPage=yes

// Fixes bug that does not let slack start after closing it via inno setup
AlwaysRestart=yes

[Files]
Source: "files\*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion;

[CustomMessages]
NameAndVersion=%1