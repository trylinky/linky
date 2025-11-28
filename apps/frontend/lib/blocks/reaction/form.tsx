import { EditFormProps } from '../types';
import { ReactionBlockConfig } from '@trylinky/blocks';

export function EditForm({}: EditFormProps<ReactionBlockConfig>) {
  return (
    <div className="bg-stone-100 rounded-md flex flex-col items-center text-center px-4 py-8">
      <span className="font-medium text-lg text-stone-800 mt-3">Reactions</span>
      <span className="font-normal text-stone-600 mt-1">
        Reactions are a fun way to engage with your audience. More coming soon!
      </span>
    </div>
  );
}
