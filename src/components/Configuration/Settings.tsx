import React from "react";
import { Setting } from "../../types";
import Form from "react-bootstrap/Form";

interface SettingsProps {
    settings: Setting[];
    onUpdateSettings: (settings: Setting[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
    return (
        <div>
            <Form>
                {settings.map((setting, index) => {
                    if (setting.type === "bool") {
                        return <Form.Check
                            key={setting.key}
                            type="switch"
                            id={setting.key}
                            defaultChecked={setting.value === "true"}
                            onChange={(e) => {
                                const newSettings = [...settings];
                                newSettings[index].value = e.target.checked.toString();
                                onUpdateSettings(newSettings);
                            }}
                            label={setting.displayName} />
                    }
                })}
            </Form>
        </div>

    );
}